import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import pg from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is not configured')

const pool = new pg.Pool({ connectionString: databaseUrl })
const client = await pool.connect()

try {
  await client.query('SELECT pg_advisory_lock($1)', [814_220_026])
  await client.query(`
    CREATE TABLE IF NOT EXISTS marketplace_schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  const migrationDirectory = resolve(process.cwd(), 'drizzle')
  const files = (await readdir(migrationDirectory)).filter(file => file.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = await readFile(resolve(migrationDirectory, file), 'utf8')
    const checksum = createHash('sha256').update(sql).digest('hex')
    const existing = await client.query('SELECT checksum FROM marketplace_schema_migrations WHERE name = $1', [file])
    if (existing.rows[0]) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Migration ${file} changed after it was applied`)
      continue
    }

    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query(
        'INSERT INTO marketplace_schema_migrations(name, checksum) VALUES ($1, $2)',
        [file, checksum]
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }
} finally {
  await client.query('SELECT pg_advisory_unlock($1)', [814_220_026]).catch(() => undefined)
  client.release()
  await pool.end()
}
