import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import pg from 'pg'

const databaseUrl = process.env.DATABASE_URL
const suite = databaseUrl ? describe : describe.skip
const pool = databaseUrl ? new pg.Pool({ connectionString: databaseUrl }) : null
const cleanDatabase = () => pool!.query('DELETE FROM moderation_reviews; DELETE FROM submissions; DELETE FROM plugin_categories; DELETE FROM plugin_translations; DELETE FROM plugin_versions; DELETE FROM plugins; DELETE FROM marketplace_users;')

suite('marketplace database contract', () => {
  beforeAll(async () => {
    await cleanDatabase()
  })

  afterAll(async () => {
    await cleanDatabase()
    await pool!.end()
  })

  it('keeps an unapproved plugin out of the public catalog shape', async () => {
    await pool!.query(`INSERT INTO marketplace_users(external_user_id, username, display_name, is_verified) VALUES (1001, 'author', 'Author', true)`)
    await pool!.query(`INSERT INTO plugins(id, owner_user_id, github_owner, github_repository) VALUES ('draft-plugin', 1001, 'owner', 'repo')`)
    const publicRows = await pool!.query('SELECT id FROM plugins WHERE published_at IS NOT NULL AND current_version IS NOT NULL')
    expect(publicRows.rows).toEqual([])
  })

  it('enforces unique immutable plugin versions', async () => {
    await pool!.query(`UPDATE plugins SET published_at = now(), current_version = '1.0.0' WHERE id = 'draft-plugin'`)
    const values = ['draft-plugin', '1.0.0', 'v1.0.0', 'https://github.com/owner/repo/releases/tag/v1.0.0', 'https://github.com/owner/repo', 'abc', JSON.stringify({ id: 'draft-plugin', name: 'Draft', version: '1.0.0', apiVersion: '1', runtime: 'worker', entry: 'main.js' })]
    await pool!.query(`INSERT INTO plugin_versions(plugin_id, version, release_tag, release_url, repository_url, commit_sha, manifest) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`, values)
    await expect(pool!.query(`INSERT INTO plugin_versions(plugin_id, version, release_tag, release_url, repository_url, commit_sha, manifest) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`, values)).rejects.toMatchObject({ code: '23505' })
  })
})
