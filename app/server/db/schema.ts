import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'
import type { CompatibilityWarning } from '#shared/plugin-contract/capabilities'
import type { PluginManifest } from '#shared/plugin-contract/manifest'
import type { GitHubSource, MarketplaceCategory, SubmissionInput } from '#shared/marketplace'

export const submissionKind = pgEnum('submission_kind', ['new_plugin', 'new_version', 'metadata_update'])
export const submissionStatus = pgEnum('submission_status', ['pending', 'approved', 'rejected'])
export const moderationDecision = pgEnum('moderation_decision', ['approved', 'rejected'])

export const marketplaceUsers = pgTable('marketplace_users', {
  externalUserId: integer('external_user_id').primaryKey(),
  username: text('username').notNull(),
  displayName: text('display_name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  isVerified: boolean('is_verified').notNull().default(false),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, table => [uniqueIndex('marketplace_users_username_idx').on(table.username)])

export const plugins = pgTable('plugins', {
  id: text('id').primaryKey(),
  ownerUserId: integer('owner_user_id').notNull().references(() => marketplaceUsers.externalUserId),
  githubOwner: text('github_owner').notNull(),
  githubRepository: text('github_repository').notNull(),
  manifestPath: text('manifest_path').notNull().default('manifest.json'),
  currentVersion: text('current_version'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, table => [
  index('plugins_owner_idx').on(table.ownerUserId),
  uniqueIndex('plugins_repository_idx').on(table.githubOwner, table.githubRepository)
])

export const pluginVersions = pgTable('plugin_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  pluginId: text('plugin_id').notNull().references(() => plugins.id, { onDelete: 'cascade' }),
  version: text('version').notNull(),
  releaseTag: text('release_tag').notNull(),
  releaseUrl: text('release_url').notNull(),
  repositoryUrl: text('repository_url').notNull(),
  commitSha: text('commit_sha').notNull(),
  manifest: jsonb('manifest').$type<PluginManifest>().notNull(),
  warnings: jsonb('warnings').$type<CompatibilityWarning[]>().notNull().default([]),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow()
}, table => [
  uniqueIndex('plugin_versions_unique_idx').on(table.pluginId, table.version),
  index('plugin_versions_published_idx').on(table.pluginId, table.publishedAt)
])

export const pluginTranslations = pgTable('plugin_translations', {
  pluginId: text('plugin_id').notNull().references(() => plugins.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  summary: text('summary').notNull().default(''),
  description: text('description').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, table => [primaryKey({ columns: [table.pluginId, table.locale] })])

export const pluginCategories = pgTable('plugin_categories', {
  pluginId: text('plugin_id').notNull().references(() => plugins.id, { onDelete: 'cascade' }),
  category: text('category').$type<MarketplaceCategory>().notNull()
}, table => [primaryKey({ columns: [table.pluginId, table.category] })])

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  pluginId: text('plugin_id').notNull(),
  submittedBy: integer('submitted_by').notNull().references(() => marketplaceUsers.externalUserId),
  kind: submissionKind('kind').notNull(),
  status: submissionStatus('status').notNull().default('pending'),
  source: jsonb('source').$type<GitHubSource>().notNull(),
  manifest: jsonb('manifest').$type<PluginManifest>().notNull(),
  warnings: jsonb('warnings').$type<CompatibilityWarning[]>().notNull().default([]),
  categories: jsonb('categories').$type<MarketplaceCategory[]>().notNull().default([]),
  translations: jsonb('translations').$type<SubmissionInput['translations']>().notNull().default({}),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: integer('reviewed_by').references(() => marketplaceUsers.externalUserId),
  reviewReason: text('review_reason')
}, table => [
  index('submissions_status_idx').on(table.status, table.submittedAt),
  index('submissions_author_idx').on(table.submittedBy, table.submittedAt)
])

export const moderationReviews = pgTable('moderation_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  reviewerUserId: integer('reviewer_user_id').notNull().references(() => marketplaceUsers.externalUserId),
  decision: moderationDecision('decision').notNull(),
  reason: text('reason').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const pluginRelations = relations(plugins, ({ one, many }) => ({
  owner: one(marketplaceUsers, { fields: [plugins.ownerUserId], references: [marketplaceUsers.externalUserId] }),
  versions: many(pluginVersions),
  translations: many(pluginTranslations),
  categories: many(pluginCategories)
}))
