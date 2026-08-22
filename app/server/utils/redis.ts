import { createClient } from 'redis'

type MarketplaceRedisClient = ReturnType<typeof createClient>

const globalState = globalThis as typeof globalThis & {
  __nnMarketplaceRedis?: MarketplaceRedisClient
  __nnMarketplaceRedisPromise?: Promise<MarketplaceRedisClient>
}

export const useRedis = async (): Promise<MarketplaceRedisClient> => {
  if (globalState.__nnMarketplaceRedis?.isReady) return globalState.__nnMarketplaceRedis
  if (globalState.__nnMarketplaceRedisPromise) return await globalState.__nnMarketplaceRedisPromise

  const config = useRuntimeConfig()
  if (!config.redisUrl) throw new Error('REDIS_URL is not configured')
  const client = createClient({ url: config.redisUrl })
  client.on('error', error => console.error(JSON.stringify({ event: 'redis_error', message: error.message })))
  globalState.__nnMarketplaceRedis = client
  globalState.__nnMarketplaceRedisPromise = client.connect().then(() => client)
  try {
    return await globalState.__nnMarketplaceRedisPromise
  } finally {
    globalState.__nnMarketplaceRedisPromise = undefined
  }
}

export const withRedisFallback = async <T>(operation: (redis: MarketplaceRedisClient) => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await operation(await useRedis())
  } catch {
    return fallback
  }
}
