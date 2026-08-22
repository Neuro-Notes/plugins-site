import { z } from 'zod'
import type { CompatibilityWarning } from './plugin-contract/capabilities'
import type { PluginManifest } from './plugin-contract/manifest'

export const marketplaceCategories = [
  'productivity',
  'editor',
  'ai',
  'import-export',
  'integrations',
  'utilities',
  'appearance',
  'other'
] as const

export const marketplaceCategorySchema = z.enum(marketplaceCategories)
export type MarketplaceCategory = z.infer<typeof marketplaceCategorySchema>

export const localizedPluginCopySchema = z.object({
  summary: z.string().trim().max(240).optional().default(''),
  description: z.string().trim().max(12_000).optional().default('')
})

export const submissionInputSchema = z.object({
  kind: z.enum(['new_plugin', 'new_version', 'metadata_update']).default('new_plugin'),
  repositoryUrl: z.string().url().max(500),
  releaseTag: z.string().trim().min(1).max(120),
  manifestPath: z.string().trim().min(1).max(240).default('manifest.json'),
  categories: z.array(marketplaceCategorySchema).max(3).default([]),
  translations: z.object({
    ru: localizedPluginCopySchema.optional(),
    en: localizedPluginCopySchema.optional()
  }).default({})
})

export type SubmissionInput = z.infer<typeof submissionInputSchema>

export interface GitHubSource {
  provider: 'github'
  owner: string
  repository: string
  repositoryUrl: string
  releaseTag: string
  releaseUrl: string
  commitSha: string
  manifestPath: string
}

export interface PluginTranslation {
  locale: 'ru' | 'en'
  summary: string
  description: string
}

export interface PluginSummary {
  id: string
  name: string
  summary: string
  author: string
  version: string
  categories: MarketplaceCategory[]
  permissions: string[]
  warnings: CompatibilityWarning[]
  source: GitHubSource
  publishedAt: string
}

export interface PluginDetail extends PluginSummary {
  description: string
  manifest: PluginManifest
  translations: PluginTranslation[]
}

export interface Paginated<T> {
  items: T[]
  page: number
  perPage: number
  total: number
}

export interface MarketplaceUser {
  id: number
  username: string
  name: string
  isAdmin: boolean
  isActive: boolean
  isVerified: boolean
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface SubmissionRecord {
  id: string
  pluginId: string
  kind: SubmissionInput['kind']
  status: SubmissionStatus
  manifest: PluginManifest
  warnings: CompatibilityWarning[]
  source: GitHubSource
  categories: MarketplaceCategory[]
  translations: SubmissionInput['translations']
  submittedAt: string
  reviewReason?: string
}
