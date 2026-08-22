import { z } from 'zod'
import { authenticatePassword } from '#server/utils/neuro-notes-auth'
import { marketplaceError, readValidatedJson } from '#server/utils/errors'
import { createSession, destroySession } from '#server/utils/session'
import { enforceRateLimit, ensureCsrf, requestClientIdentifier, requireCsrf } from '#server/utils/security'

const loginSchema = z.object({
  identity: z.string().trim().min(1).max(320),
  password: z.string().min(1).max(1024)
})

export default defineEventHandler(async (event) => {
  requireCsrf(event)
  await enforceRateLimit(event, 'login', requestClientIdentifier(event), 10, 10 * 60)
  const body = await readValidatedJson(event, input => loginSchema.safeParse(input))
  await destroySession(event)
  let result
  try {
    result = await authenticatePassword(body.identity, body.password)
  } catch {
    throw marketplaceError(event, 502, 'identity_provider_unavailable', 'Neuro Notes authentication is unavailable')
  }
  if (!result.response.ok) {
    throw marketplaceError(event, result.response.status === 401 ? 401 : 502, result.data.code || 'login_failed', result.data.detail || 'Login failed')
  }
  if (result.data.requires_totp) {
    if (!result.data.challenge_token) throw marketplaceError(event, 502, 'totp_challenge_invalid', 'Identity provider returned an invalid TOTP challenge')
    await createSession(event, { kind: 'totp_challenge', challengeToken: result.data.challenge_token })
    return { authenticated: false, requiresTotp: true, expiresIn: Math.min(result.data.expires_in || 300, 300) }
  }
  if (!result.data.access_token || !result.data.refresh_token) {
    throw marketplaceError(event, 502, 'auth_response_invalid', 'Identity provider returned an invalid session')
  }
  await createSession(event, {
    kind: 'authenticated',
    accessToken: result.data.access_token,
    refreshToken: result.data.refresh_token
  })
  ensureCsrf(event)
  return { authenticated: true, requiresTotp: false }
})
