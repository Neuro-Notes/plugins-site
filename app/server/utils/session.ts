import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import type { MarketplaceUser } from '#shared/marketplace'
import { marketplaceError } from './errors'
import { useRedis } from './redis'

const AUTH_SESSION_TTL = 90 * 24 * 60 * 60
const CHALLENGE_SESSION_TTL = 5 * 60
const isProduction = () => process.env.NODE_ENV === 'production'
const sessionCookieName = () => isProduction() ? '__Host-nn_plugins_session' : 'nn_plugins_session'

export type StoredSession = {
  kind: 'authenticated'
  accessToken: string
  refreshToken: string
  user?: MarketplaceUser
} | {
  kind: 'totp_challenge'
  challengeToken: string
}

const encryptionKey = (): Buffer => {
  const secret = String(useRuntimeConfig().sessionEncryptionKey || '')
  if (secret.length < 32) throw new Error('NUXT_SESSION_ENCRYPTION_KEY must contain at least 32 characters')
  return createHash('sha256').update(secret).digest()
}

export const encryptSession = (session: StoredSession): string => {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(session), 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), ciphertext].map(value => value.toString('base64url')).join('.')
}

export const decryptSession = (encrypted: string): StoredSession => {
  const [ivValue, tagValue, ciphertextValue] = encrypted.split('.')
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error('Invalid encrypted session')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, 'base64url')),
    decipher.final()
  ]).toString('utf8')
  return JSON.parse(plaintext) as StoredSession
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: 'strict' as const,
  path: '/',
  maxAge
})

export const createSession = async (event: H3Event, session: StoredSession): Promise<void> => {
  const redis = await useRedis().catch(() => {
    throw marketplaceError(event, 503, 'redis_unavailable', 'Session service is unavailable')
  })
  const sessionId = randomUUID()
  const ttl = session.kind === 'authenticated' ? AUTH_SESSION_TTL : CHALLENGE_SESSION_TTL
  await redis.set(`session:${sessionId}`, encryptSession(session), { EX: ttl })
  setCookie(event, sessionCookieName(), sessionId, cookieOptions(ttl))
}

export const readSession = async (event: H3Event): Promise<{ id: string, data: StoredSession } | null> => {
  const sessionId = getCookie(event, sessionCookieName())
  if (!sessionId) return null
  try {
    const redis = await useRedis()
    const encrypted = await redis.get(`session:${sessionId}`)
    if (!encrypted) return null
    return { id: sessionId, data: decryptSession(encrypted) }
  } catch {
    throw marketplaceError(event, 503, 'redis_unavailable', 'Session service is unavailable')
  }
}

export const updateStoredSession = async (event: H3Event, id: string, session: StoredSession): Promise<void> => {
  const redis = await useRedis().catch(() => {
    throw marketplaceError(event, 503, 'redis_unavailable', 'Session service is unavailable')
  })
  const ttl = session.kind === 'authenticated' ? AUTH_SESSION_TTL : CHALLENGE_SESSION_TTL
  await redis.set(`session:${id}`, encryptSession(session), { EX: ttl })
  setCookie(event, sessionCookieName(), id, cookieOptions(ttl))
}

export const destroySession = async (event: H3Event): Promise<void> => {
  const sessionId = getCookie(event, sessionCookieName())
  if (sessionId) await useRedis().then(redis => redis.del(`session:${sessionId}`)).catch(() => undefined)
  deleteCookie(event, sessionCookieName(), cookieOptions(0))
}
