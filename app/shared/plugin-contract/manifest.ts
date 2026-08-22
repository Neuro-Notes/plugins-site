import { z } from 'zod'

export const PLUGIN_API_VERSION = '1'
export const COMMUNITY_PLUGIN_ROOT = '/.nnotes/plugins'

const idPattern = /^[a-z0-9][a-z0-9._-]{1,79}$/
const commandIdPattern = /^[a-z0-9][a-z0-9._-]{1,127}$/
const semverPattern = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/
const safeRelativePathPattern = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\\).+$/

const trimmedString = (maximum: number) => z.string().trim().min(1).max(maximum)
const stringList = (maximumItems: number, maximumLength: number) => (
  z.array(trimmedString(maximumLength)).max(maximumItems).transform(items => [...new Set(items)])
)

export const pluginRuntimeSchema = z.enum(['system', 'worker', 'iframe'])

export const pluginActivationEventSchema = z.string().max(180).refine(value => (
  value === 'onStartupFinished'
    || value.startsWith('onCommand:')
    || value.startsWith('onFile:')
    || value.startsWith('onView:')
), 'Unsupported activation event')

export const pluginManifestSchema = z.object({
  id: trimmedString(80).regex(idPattern, 'Invalid plugin id'),
  name: trimmedString(160),
  version: trimmedString(80).regex(semverPattern, 'Version must be semver-like'),
  apiVersion: z.literal(PLUGIN_API_VERSION),
  description: z.string().trim().max(1000).optional(),
  author: z.string().trim().max(160).optional(),
  entry: z.string().trim().max(240).regex(safeRelativePathPattern, 'Entry must be a safe relative path').optional(),
  runtime: pluginRuntimeSchema.default('worker'),
  activationEvents: z.array(pluginActivationEventSchema).max(32).optional(),
  contributes: z.object({
    commands: z.array(z.object({
      id: trimmedString(128).regex(commandIdPattern, 'Invalid command id'),
      title: trimmedString(160),
      description: z.string().trim().max(500).optional()
    })).max(64).optional(),
    settings: z.union([
      z.literal(true),
      z.array(z.object({
        id: trimmedString(128).regex(commandIdPattern, 'Invalid setting id'),
        title: trimmedString(160),
        description: z.string().trim().max(500).optional()
      })).max(16)
    ]).optional(),
    aiTools: stringList(32, 128).optional(),
    markdownExtensions: z.boolean().optional(),
    noteTypes: stringList(16, 80).optional(),
    views: stringList(16, 80).optional()
  }).strict().optional(),
  permissions: z.object({
    vault: z.object({
      read: stringList(128, 240).optional(),
      write: stringList(128, 240).optional(),
      delete: stringList(128, 240).optional(),
      watch: stringList(128, 240).optional()
    }).strict().optional(),
    network: stringList(64, 260).optional(),
    ai: z.boolean().optional(),
    clipboard: z.union([
      z.boolean(),
      z.object({ read: z.boolean().optional(), write: z.boolean().optional() }).strict()
    ]).optional(),
    editor: z.object({ read: z.boolean().optional(), write: z.boolean().optional() }).strict().optional(),
    native: stringList(32, 120).optional()
  }).strict().optional()
}).strict().superRefine((manifest, context) => {
  if (manifest.runtime !== 'system' && !manifest.entry) {
    context.addIssue({ code: 'custom', path: ['entry'], message: 'Entry is required for community runtimes' })
  }
})

export type PluginManifest = z.infer<typeof pluginManifestSchema>

export interface ManifestValidationResult {
  manifest: PluginManifest | null
  errors: string[]
}

export const validatePluginManifest = (input: unknown): ManifestValidationResult => {
  const result = pluginManifestSchema.safeParse(input)
  if (result.success) return { manifest: result.data, errors: [] }
  return {
    manifest: null,
    errors: result.error.issues.map(issue => `${issue.path.join('.') || 'manifest'}: ${issue.message}`)
  }
}

export const parsePluginManifestJson = (input: string): ManifestValidationResult => {
  try {
    return validatePluginManifest(JSON.parse(input))
  } catch {
    return { manifest: null, errors: ['manifest: Manifest is not valid JSON'] }
  }
}

export const normalizeReleaseVersion = (tag: string) => tag.trim().replace(/^v(?=\d)/, '')
