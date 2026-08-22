import { posix } from 'node:path'
import type { H3Event } from 'h3'
import { compatibilityWarnings } from '#shared/plugin-contract/capabilities'
import { normalizeReleaseVersion, validatePluginManifest } from '#shared/plugin-contract/manifest'
import type { GitHubSource, SubmissionInput } from '#shared/marketplace'
import { marketplaceError } from './errors'
import { withRedisFallback } from './redis'

export interface ValidatedGitHubPlugin {
  source: GitHubSource
  manifest: NonNullable<ReturnType<typeof validatePluginManifest>['manifest']>
  warnings: ReturnType<typeof compatibilityWarnings>
}

export const parseGitHubRepositoryUrl = (input: string): { owner: string, repository: string } | null => {
  try {
    const url = new URL(input)
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com' || url.username || url.password || url.port) return null
    const segments = url.pathname.split('/').filter(Boolean)
    if (segments.length !== 2) return null
    const owner = segments[0]!
    const rawRepository = segments[1]!
    const repository = rawRepository.replace(/\.git$/, '')
    if (!/^[A-Za-z0-9_.-]{1,100}$/.test(owner) || !/^[A-Za-z0-9_.-]{1,100}$/.test(repository)) return null
    return { owner, repository }
  } catch {
    return null
  }
}

export const isSafeRepositoryPath = (path: string) => {
  const normalized = path.trim()
  return Boolean(normalized)
    && !normalized.includes('\\')
    && !normalized.startsWith('/')
    && !normalized.split('/').some(segment => segment === '..' || segment === '.')
}

const githubRequest = async <T>(event: H3Event, path: string): Promise<T> => {
  const config = useRuntimeConfig(event)
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'neuro-notes-plugins-marketplace',
    'x-github-api-version': '2022-11-28'
  }
  if (config.githubToken) headers.authorization = `Bearer ${config.githubToken}`
  const response = await fetch(`https://api.github.com${path}`, {
    headers,
    redirect: 'error',
    signal: AbortSignal.timeout(10_000)
  })
  if (!response.ok) {
    const code = response.status === 404 ? 'github_resource_not_found' : 'github_api_error'
    throw marketplaceError(event, response.status === 404 ? 422 : 502, code, 'GitHub resource could not be validated')
  }
  return await response.json() as T
}

export const validateGitHubPlugin = async (event: H3Event, input: SubmissionInput): Promise<ValidatedGitHubPlugin> => {
  const coordinates = parseGitHubRepositoryUrl(input.repositoryUrl)
  if (!coordinates) throw marketplaceError(event, 422, 'github_url_invalid', 'Only public github.com owner/repository URLs are accepted')
  if (!isSafeRepositoryPath(input.manifestPath)) {
    throw marketplaceError(event, 422, 'manifest_path_invalid', 'Manifest path must be relative and stay inside the repository')
  }

  const cacheKey = `github-validation:${coordinates.owner.toLowerCase()}:${coordinates.repository.toLowerCase()}:${input.releaseTag}:${input.manifestPath}`
  const cached = await withRedisFallback(redis => redis.get(cacheKey), null)
  if (cached) return JSON.parse(cached) as ValidatedGitHubPlugin

  const base = `/repos/${encodeURIComponent(coordinates.owner)}/${encodeURIComponent(coordinates.repository)}`
  const repository = await githubRequest<{ private: boolean, archived: boolean, html_url: string }>(event, base)
  if (repository.private) throw marketplaceError(event, 422, 'github_repository_private', 'Repository must be public')
  if (repository.archived) throw marketplaceError(event, 422, 'github_repository_archived', 'Archived repositories cannot be published')

  const tag = encodeURIComponent(input.releaseTag)
  const release = await githubRequest<{ draft: boolean, html_url: string, tag_name: string }>(event, `${base}/releases/tags/${tag}`)
  if (release.draft) throw marketplaceError(event, 422, 'github_release_draft', 'Release must be published')
  const commit = await githubRequest<{ sha: string }>(event, `${base}/commits/${tag}`)
  const manifestContent = await githubRequest<{ type: string, content?: string, encoding?: string }>(
    event,
    `${base}/contents/${input.manifestPath.split('/').map(encodeURIComponent).join('/')}?ref=${tag}`
  )
  if (manifestContent.type !== 'file' || manifestContent.encoding !== 'base64' || !manifestContent.content) {
    throw marketplaceError(event, 422, 'manifest_missing', 'Manifest must be a regular JSON file')
  }

  let manifestInput: unknown
  try {
    manifestInput = JSON.parse(Buffer.from(manifestContent.content.replace(/\s/g, ''), 'base64').toString('utf8'))
  } catch {
    throw marketplaceError(event, 422, 'manifest_invalid_json', 'Manifest is not valid JSON')
  }
  const validation = validatePluginManifest(manifestInput)
  if (!validation.manifest) {
    throw marketplaceError(event, 422, 'manifest_invalid', 'Manifest validation failed', validation.errors)
  }
  if (validation.manifest.version !== normalizeReleaseVersion(release.tag_name)) {
    throw marketplaceError(event, 422, 'release_version_mismatch', 'Manifest version must match the GitHub release tag')
  }

  const entryPath = posix.join(posix.dirname(input.manifestPath), validation.manifest.entry || 'main.js')
  if (!isSafeRepositoryPath(entryPath)) throw marketplaceError(event, 422, 'entry_path_invalid', 'Plugin entry path is unsafe')
  await githubRequest(event, `${base}/contents/${entryPath.split('/').map(encodeURIComponent).join('/')}?ref=${tag}`)

  const result: ValidatedGitHubPlugin = {
    source: {
      provider: 'github',
      owner: coordinates.owner,
      repository: coordinates.repository,
      repositoryUrl: repository.html_url,
      releaseTag: release.tag_name,
      releaseUrl: release.html_url,
      commitSha: commit.sha,
      manifestPath: input.manifestPath
    },
    manifest: validation.manifest,
    warnings: compatibilityWarnings(validation.manifest)
  }
  await withRedisFallback(async redis => {
    await redis.set(cacheKey, JSON.stringify(result), { EX: 10 * 60 })
    return true
  }, false)
  return result
}
