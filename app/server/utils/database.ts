import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '#server/db/schema'

const globalState = globalThis as typeof globalThis & {
  __nnMarketplacePool?: Pool
  __nnMarketplaceDb?: ReturnType<typeof drizzle<typeof schema>>
}

export const useDatabasePool = () => {
  if (!globalState.__nnMarketplacePool) {
    const config = useRuntimeConfig()
    if (!config.databaseUrl) throw new Error('DATABASE_URL is not configured')
    globalState.__nnMarketplacePool = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    })
  }
  return globalState.__nnMarketplacePool
}

export const useDatabase = () => {
  if (!globalState.__nnMarketplaceDb) {
    globalState.__nnMarketplaceDb = drizzle(useDatabasePool(), { schema })
  }
  return globalState.__nnMarketplaceDb
}
