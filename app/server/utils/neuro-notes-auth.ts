import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import type { MarketplaceUser } from '#shared/marketplace'
import { marketplaceUsers } from '#server/db/schema'
import { useDatabase } from './database'
import { marketplaceError } from './errors'
import { readSession, updateStoredSession, type StoredSession } from './session'

interface BackendTokenResponse {
  access_token?: string
  refresh_token?: string
  requires_totp?: boolean
  challenge_token?: string
  expires_in?: number
  detail?: string
  code?: string
}

interface BackendUser {
  id: number
  username: string
  name: string
  is_admin: boolean
  is_active: boolean
  is_verified: boolean
}

const backendUrl = (path: string) => `${String(useRuntimeConfig().backendBaseUrl).replace(/\/+$/, '')}${path}`

export const backendRequest = async <T>(path: string, init: RequestInit = {}): Promise<{ response: Response, data: T }> => {
  const response = await fetch(backendUrl(path), {
    ...init,
    redirect: 'manual',
    signal: AbortSignal.timeout(8_000),
    headers: { accept: 'application/json', ...(init.headers || {}) }
  })
  const data = await response.json().catch(() => ({})) as T
  return { response, data }
}

export const authenticatePassword = async (identity: string, password: string) => {
  const normalized = identity.trim().toLowerCase()
  const body = normalized.includes('@') ? { email: normalized, password } : { username: normalized, password }
  return await backendRequest<BackendTokenResponse>('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export const authenticateTotp = async (challengeToken: string, code: string) => await backendRequest<BackendTokenResponse>(
  '/auth/totp/login',
  {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ challenge_token: challengeToken, code })
  }
)

const toMarketplaceUser = (user: BackendUser): MarketplaceUser => ({
  id: user.id,
  username: user.username,
  name: user.name,
  isAdmin: user.is_admin,
  isActive: user.is_active,
  isVerified: user.is_verified
})

const persistUser = async (user: MarketplaceUser): Promise<void> => {
  await useDatabase().insert(marketplaceUsers).values({
    externalUserId: user.id,
    username: user.username,
    displayName: user.name,
    isActive: user.isActive,
    isVerified: user.isVerified,
    lastSeenAt: new Date()
  }).onConflictDoUpdate({
    target: marketplaceUsers.externalUserId,
    set: {
      username: user.username,
      displayName: user.name,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastSeenAt: new Date()
    }
  })
}

const refreshAccessToken = async (session: Extract<StoredSession, { kind: 'authenticated' }>) => {
  const { response, data } = await backendRequest<BackendTokenResponse>('/auth/refresh', {
    method: 'POST',
    headers: { authorization: `Bearer ${session.refreshToken}` }
  })
  if (!response.ok || !data.access_token || !data.refresh_token) return null
  return { ...session, accessToken: data.access_token, refreshToken: data.refresh_token }
}

export const currentUser = async (event: H3Event): Promise<MarketplaceUser | null> => {
  const stored = await readSession(event)
  if (!stored || stored.data.kind !== 'authenticated') return null
  let session = stored.data

  let result = await backendRequest<BackendUser>('/users/me', {
    headers: { authorization: `Bearer ${session.accessToken}` }
  })
  if (result.response.status === 401) {
    const refreshed = await refreshAccessToken(session)
    if (!refreshed) return null
    session = refreshed
    result = await backendRequest<BackendUser>('/users/me', {
      headers: { authorization: `Bearer ${session.accessToken}` }
    })
  }
  if (!result.response.ok) return null

  const user = toMarketplaceUser(result.data)
  await persistUser(user)
  await updateStoredSession(event, stored.id, { ...session, user })
  event.context.user = user
  return user
}

export const requireUser = async (event: H3Event, options: { admin?: boolean, verified?: boolean } = {}) => {
  const user = await currentUser(event)
  if (!user) throw marketplaceError(event, 401, 'authentication_required', 'Authentication required')
  if (!user.isActive) throw marketplaceError(event, 403, 'account_inactive', 'Active account required')
  if (options.verified && !user.isVerified) throw marketplaceError(event, 403, 'account_unverified', 'Verified account required')
  if (options.admin && !user.isAdmin) throw marketplaceError(event, 403, 'admin_required', 'Administrator access required')
  return user
}

export const marketplaceUserExists = async (userId: number) => {
  const rows = await useDatabase().select().from(marketplaceUsers).where(eq(marketplaceUsers.externalUserId, userId)).limit(1)
  return Boolean(rows[0])
}
