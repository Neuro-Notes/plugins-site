import { useDatabasePool } from '#server/utils/database'
import { useRedis } from '#server/utils/redis'

export default defineEventHandler(async (event) => {
  try {
    await Promise.all([useDatabasePool().query('SELECT 1'), useRedis().then(redis => redis.ping())])
    return { status: 'ready', database: 'ok', redis: 'ok' }
  } catch {
    setResponseStatus(event, 503)
    return { status: 'unavailable', database: 'unknown', redis: 'unknown' }
  }
})
