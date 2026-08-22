import type { PoolClient, QueryResultRow } from 'pg'
import type { H3Event } from 'h3'
import type {
  MarketplaceCategory,
  Paginated,
  PluginDetail,
  PluginSummary,
  SubmissionInput,
  SubmissionRecord
} from '#shared/marketplace'
import { marketplaceCategories } from '#shared/marketplace'
import { useDatabasePool } from '#server/utils/database'
import { marketplaceError } from '#server/utils/errors'
import type { ValidatedGitHubPlugin } from '#server/utils/github'
import { withRedisFallback } from '#server/utils/redis'

type Locale = 'ru' | 'en'

const localeValue = (value: unknown): Locale => value === 'en' ? 'en' : 'ru'
const dateString = (value: string | Date) => new Date(value).toISOString()

const rowToSummary = (row: QueryResultRow): PluginSummary => ({
  id: row.id,
  name: row.manifest.name,
  summary: row.summary || row.manifest.description || '',
  author: row.manifest.author || row.owner_name,
  version: row.version,
  categories: row.categories || [],
  permissions: row.permissions || [],
  warnings: row.warnings || [],
  source: {
    provider: 'github',
    owner: row.github_owner,
    repository: row.github_repository,
    repositoryUrl: row.repository_url,
    releaseTag: row.release_tag,
    releaseUrl: row.release_url,
    commitSha: row.commit_sha,
    manifestPath: row.manifest_path
  },
  publishedAt: dateString(row.version_published_at)
})

const publicSelect = `
  SELECT p.id, p.github_owner, p.github_repository, p.manifest_path,
    v.version, v.release_tag, v.release_url, v.repository_url, v.commit_sha,
    v.manifest, v.warnings, v.published_at AS version_published_at,
    u.display_name AS owner_name,
    COALESCE(t.summary, '') AS summary,
    COALESCE(t.description, '') AS description,
    COALESCE((SELECT json_agg(pc.category ORDER BY pc.category) FROM plugin_categories pc WHERE pc.plugin_id = p.id), '[]') AS categories,
    COALESCE((
      SELECT json_agg(permission_key ORDER BY permission_key)
      FROM (
        SELECT CASE key
          WHEN 'network' THEN 'network:fetch'
          WHEN 'ai' THEN 'ai:use'
          WHEN 'clipboard' THEN 'clipboard:use'
          WHEN 'editor' THEN 'editor:use'
          WHEN 'native' THEN 'native:use'
          WHEN 'vault' THEN 'vault:use'
          ELSE key
        END AS permission_key
        FROM jsonb_object_keys(COALESCE(v.manifest->'permissions', '{}'::jsonb)) key
      ) permission_rows
    ), '[]') AS permissions
  FROM plugins p
  JOIN plugin_versions v ON v.plugin_id = p.id AND v.version = p.current_version
  JOIN marketplace_users u ON u.external_user_id = p.owner_user_id
  LEFT JOIN plugin_translations t ON t.plugin_id = p.id AND t.locale = $1
`

export const listPlugins = async (query: Record<string, unknown>): Promise<Paginated<PluginSummary>> => {
  const locale = localeValue(query.locale)
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 100) : ''
  const category = marketplaceCategories.includes(query.category as MarketplaceCategory)
    ? query.category as MarketplaceCategory
    : ''
  const page = Math.max(1, Math.min(10_000, Number(query.page) || 1))
  const perPage = Math.max(1, Math.min(50, Number(query.perPage) || 12))
  const sort = query.sort === 'name' || query.sort === 'oldest' ? query.sort : 'newest'
  const cacheVersion = await withRedisFallback(redis => redis.get('catalog:version'), '0')
  const cacheKey = `catalog:${cacheVersion}:${locale}:${search}:${category}:${sort}:${page}:${perPage}`
  const cached = await withRedisFallback(redis => redis.get(cacheKey), null)
  if (cached) return JSON.parse(cached) as Paginated<PluginSummary>

  const parameters: unknown[] = [locale]
  const conditions = ['p.published_at IS NOT NULL']
  if (search) {
    parameters.push(search)
    conditions.push(`(
      p.id ILIKE '%' || $${parameters.length} || '%'
      OR v.manifest->>'name' ILIKE '%' || $${parameters.length} || '%'
      OR v.manifest->>'description' ILIKE '%' || $${parameters.length} || '%'
      OR similarity(v.manifest->>'name', $${parameters.length}) > 0.2
    )`)
  }
  if (category) {
    parameters.push(category)
    conditions.push(`EXISTS (SELECT 1 FROM plugin_categories pc WHERE pc.plugin_id = p.id AND pc.category = $${parameters.length})`)
  }
  const where = conditions.join(' AND ')
  const order = sort === 'name'
    ? `v.manifest->>'name' ASC`
    : sort === 'oldest' ? 'v.published_at ASC' : 'v.published_at DESC'
  const count = await useDatabasePool().query(
    `SELECT count(*)::int AS total
     FROM plugins p
     JOIN plugin_versions v ON v.plugin_id = p.id AND v.version = p.current_version
     CROSS JOIN (SELECT $1::text AS locale_parameter) ignored_locale
     WHERE ${where}`,
    parameters
  )

  parameters.push(perPage, (page - 1) * perPage)
  const rows = await useDatabasePool().query(
    `${publicSelect} WHERE ${where} ORDER BY ${order} LIMIT $${parameters.length - 1} OFFSET $${parameters.length}`,
    parameters
  )
  const result = { items: rows.rows.map(rowToSummary), page, perPage, total: count.rows[0]?.total || 0 }
  await withRedisFallback(async redis => {
    await redis.set(cacheKey, JSON.stringify(result), { EX: 60 })
    return true
  }, false)
  return result
}

export const getPlugin = async (pluginId: string, localeInput: unknown): Promise<PluginDetail | null> => {
  const locale = localeValue(localeInput)
  const cacheVersion = await withRedisFallback(redis => redis.get('catalog:version'), '0')
  const cacheKey = `plugin:${cacheVersion}:${locale}:${pluginId}`
  const cached = await withRedisFallback(redis => redis.get(cacheKey), null)
  if (cached) return JSON.parse(cached) as PluginDetail

  const result = await useDatabasePool().query(`${publicSelect} WHERE p.id = $2 AND p.published_at IS NOT NULL`, [locale, pluginId])
  const row = result.rows[0]
  if (!row) return null
  const translationRows = await useDatabasePool().query(
    'SELECT locale, summary, description FROM plugin_translations WHERE plugin_id = $1 ORDER BY locale',
    [pluginId]
  )
  const detail: PluginDetail = {
    ...rowToSummary(row),
    description: row.description || row.manifest.description || '',
    manifest: row.manifest,
    translations: translationRows.rows
  }
  await withRedisFallback(async redis => {
    await redis.set(cacheKey, JSON.stringify(detail), { EX: 300 })
    return true
  }, false)
  return detail
}

export const listPluginVersions = async (pluginId: string) => {
  const result = await useDatabasePool().query(
    `SELECT version, release_tag, release_url, commit_sha, warnings, published_at
     FROM plugin_versions WHERE plugin_id = $1 ORDER BY published_at DESC`,
    [pluginId]
  )
  return result.rows.map(row => ({
    version: row.version,
    releaseTag: row.release_tag,
    releaseUrl: row.release_url,
    commitSha: row.commit_sha,
    warnings: row.warnings,
    publishedAt: dateString(row.published_at)
  }))
}

const rowToSubmission = (row: QueryResultRow): SubmissionRecord => ({
  id: row.id,
  pluginId: row.plugin_id,
  kind: row.kind,
  status: row.status,
  manifest: row.manifest,
  warnings: row.warnings,
  source: row.source,
  categories: row.categories,
  translations: row.translations,
  submittedAt: dateString(row.submitted_at),
  ...(row.review_reason ? { reviewReason: row.review_reason } : {})
})

export const createSubmission = async (
  event: H3Event,
  userId: number,
  input: SubmissionInput,
  validated: ValidatedGitHubPlugin
): Promise<SubmissionRecord> => {
  const client = await useDatabasePool().connect()
  try {
    await client.query('BEGIN')
    const existing = await client.query('SELECT id, owner_user_id, current_version FROM plugins WHERE id = $1 FOR UPDATE', [validated.manifest.id])
    const plugin = existing.rows[0]
    if (plugin && plugin.owner_user_id !== userId) {
      throw marketplaceError(event, 409, 'plugin_owned_by_another_user', 'Plugin ID is already owned by another author')
    }
    if (!plugin && input.kind !== 'new_plugin') {
      throw marketplaceError(event, 422, 'plugin_not_found', 'New plugins must use submission kind new_plugin')
    }
    if (plugin && input.kind === 'new_plugin') {
      throw marketplaceError(event, 422, 'plugin_already_exists', 'Existing plugins must use new_version or metadata_update')
    }
    if (input.kind === 'metadata_update' && plugin?.current_version !== validated.manifest.version) {
      throw marketplaceError(event, 422, 'metadata_version_mismatch', 'Metadata updates must target the current published version')
    }
    if (!plugin) {
      await client.query(
        `INSERT INTO plugins(id, owner_user_id, github_owner, github_repository, manifest_path)
         VALUES ($1, $2, $3, $4, $5)`,
        [validated.manifest.id, userId, validated.source.owner, validated.source.repository, validated.source.manifestPath]
      )
    }
    const inserted = await client.query(
      `INSERT INTO submissions(plugin_id, submitted_by, kind, source, manifest, warnings, categories, translations)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb)
       RETURNING *`,
      [
        validated.manifest.id,
        userId,
        input.kind,
        JSON.stringify(validated.source),
        JSON.stringify(validated.manifest),
        JSON.stringify(validated.warnings),
        JSON.stringify(input.categories),
        JSON.stringify(input.translations)
      ]
    )
    await client.query('COMMIT')
    return rowToSubmission(inserted.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    if (error && typeof error === 'object' && 'constraint' in error) {
      throw marketplaceError(event, 409, 'submission_conflict', 'A submission for this plugin version is already pending')
    }
    throw error
  } finally {
    client.release()
  }
}

export const listSubmissions = async (options: { userId?: number, status?: string }) => {
  const parameters: unknown[] = []
  const conditions: string[] = []
  if (options.userId) {
    parameters.push(options.userId)
    conditions.push(`submitted_by = $${parameters.length}`)
  }
  if (options.status && ['pending', 'approved', 'rejected'].includes(options.status)) {
    parameters.push(options.status)
    conditions.push(`status = $${parameters.length}`)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await useDatabasePool().query(`SELECT * FROM submissions ${where} ORDER BY submitted_at DESC LIMIT 200`, parameters)
  return result.rows.map(rowToSubmission)
}

const compareSemver = (left: string, right: string) => {
  const parse = (value: string): [number, number, number] => {
    const parts = (value.split(/[+-]/)[0] || '').split('.').map(Number)
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
  }
  const a = parse(left)
  const b = parse(right)
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index]! > b[index]! ? 1 : -1
  }
  return left.includes('-') === right.includes('-') ? 0 : left.includes('-') ? -1 : 1
}

const approveSubmission = async (client: PoolClient, submission: QueryResultRow) => {
  const source = submission.source
  const manifest = submission.manifest
  await client.query(
    `UPDATE plugins SET github_owner = $2, github_repository = $3, manifest_path = $4,
       published_at = COALESCE(published_at, now()), updated_at = now()
     WHERE id = $1`,
    [submission.plugin_id, source.owner, source.repository, source.manifestPath]
  )
  if (submission.kind !== 'metadata_update') {
    await client.query(
      `INSERT INTO plugin_versions(plugin_id, version, release_tag, release_url, repository_url, commit_sha, manifest, warnings)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
      [
        submission.plugin_id,
        manifest.version,
        source.releaseTag,
        source.releaseUrl,
        source.repositoryUrl,
        source.commitSha,
        JSON.stringify(manifest),
        JSON.stringify(submission.warnings)
      ]
    )
  }
  const pluginResult = await client.query('SELECT current_version FROM plugins WHERE id = $1', [submission.plugin_id])
  const currentVersion = pluginResult.rows[0]?.current_version
  if (!currentVersion || compareSemver(manifest.version, currentVersion) >= 0) {
    await client.query('UPDATE plugins SET current_version = $2 WHERE id = $1', [submission.plugin_id, manifest.version])
  }
  for (const locale of ['ru', 'en'] as const) {
    const copy = submission.translations?.[locale]
    if (!copy) continue
    await client.query(
      `INSERT INTO plugin_translations(plugin_id, locale, summary, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (plugin_id, locale) DO UPDATE
       SET summary = EXCLUDED.summary, description = EXCLUDED.description, updated_at = now()`,
      [submission.plugin_id, locale, copy.summary || '', copy.description || '']
    )
  }
  await client.query('DELETE FROM plugin_categories WHERE plugin_id = $1', [submission.plugin_id])
  for (const category of submission.categories) {
    await client.query('INSERT INTO plugin_categories(plugin_id, category) VALUES ($1, $2)', [submission.plugin_id, category])
  }
}

export const decideSubmission = async (
  event: H3Event,
  submissionId: string,
  reviewerUserId: number,
  decision: 'approved' | 'rejected',
  reason: string
): Promise<SubmissionRecord> => {
  if (decision === 'rejected' && !reason.trim()) {
    throw marketplaceError(event, 422, 'rejection_reason_required', 'A rejection reason is required')
  }
  const client = await useDatabasePool().connect()
  try {
    await client.query('BEGIN')
    const result = await client.query('SELECT * FROM submissions WHERE id = $1 FOR UPDATE', [submissionId])
    const submission = result.rows[0]
    if (!submission) throw marketplaceError(event, 404, 'submission_not_found', 'Submission not found')
    if (submission.status !== 'pending') throw marketplaceError(event, 409, 'submission_already_reviewed', 'Submission was already reviewed')
    if (decision === 'approved') await approveSubmission(client, submission)
    const updated = await client.query(
      `UPDATE submissions SET status = $2, reviewed_at = now(), reviewed_by = $3, review_reason = $4
       WHERE id = $1 RETURNING *`,
      [submissionId, decision, reviewerUserId, reason.trim()]
    )
    await client.query(
      'INSERT INTO moderation_reviews(submission_id, reviewer_user_id, decision, reason) VALUES ($1, $2, $3, $4)',
      [submissionId, reviewerUserId, decision, reason.trim()]
    )
    await client.query('COMMIT')
    await withRedisFallback(redis => redis.incr('catalog:version'), 0)
    return rowToSubmission(updated.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
