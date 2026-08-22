import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { marketplaceError } from './errors'
import { useRedis } from './redis'

const isProduction = () => process.env.NODE_ENV === 'production'
const csrfCookieName = () => isProduction() ? '__Host-nn_plugins_csrf' : 'nn_plugins_csrf'

const cookieOptions = () => ({
  secure: isProduction(),
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 90 * 24 * 60 * 60
})

export const ensureCsrf = (event: H3Event): string => {
  const existing = getCookie(event, csrfCookieName())
  if (existing && existing.length >= 32) return existing
  const token = randomBytes(32).toString('base64url')
  setCookie(event, csrfCookieName(), token, { ...cookieOptions(), httpOnly: false })
  return token
}

export const clearCsrf = (event: H3Event) => deleteCookie(event, csrfCookieName(), {
  ...cookieOptions(),
  httpOnly: false
})

export const requireCsrf = (event: H3Event): void => {
  const cookieToken = getCookie(event, csrfCookieName()) || ''
  const headerToken = getHeader(event, 'x-csrf-token') || ''
  const valid = cookieToken.length === headerToken.length
    && cookieToken.length >= 32
    && timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))
  if (!valid) throw marketplaceError(event, 403, 'csrf_invalid', 'CSRF validation failed')
}

export const enforceRateLimit = async (
  event: H3Event,
  scope: string,
  identifier: string,
  maximum: number,
  windowSeconds: number
): Promise<void> => {
  try {
    const redis = await useRedis()
    const bucket = Math.floor(Date.now() / (windowSeconds * 1000))
    const key = `rate:${scope}:${identifier}:${bucket}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, windowSeconds + 5)
    if (count > maximum) throw marketplaceError(event, 429, 'rate_limit_exceeded', 'Too many requests')
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw marketplaceError(event, 503, 'redis_unavailable', 'Session and rate-limit service is unavailable')
  }
}

export const requestClientIdentifier = (event: H3Event) => {
  const forwarded = getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || event.node.req.socket.remoteAddress || 'unknown'
}
