import { z } from 'zod'
import { authenticateTotp } from '#server/utils/neuro-notes-auth'
import { marketplaceError, readValidatedJson } from '#server/utils/errors'
import { createSession, destroySession, readSession } from '#server/utils/session'
import { enforceRateLimit, requestClientIdentifier, requireCsrf } from '#server/utils/security'

const totpSchema = z.object({ code: z.string().trim().regex(/^\d{6}$|^[A-Za-z0-9-]{6,32}$/) })

export default defineEventHandler(async (event) => {
  requireCsrf(event)
  await enforceRateLimit(event, 'totp', requestClientIdentifier(event), 8, 10 * 60)
  const body = await readValidatedJson(event, input => totpSchema.safeParse(input))
  const stored = await readSession(event)
  if (!stored || stored.data.kind !== 'totp_challenge') {
    throw marketplaceError(event, 401, 'totp_challenge_missing', 'TOTP challenge is missing or expired')
  }
  let result
  try {
    result = await authenticateTotp(stored.data.challengeToken, body.code)
  } catch {
    throw marketplaceError(event, 502, 'identity_provider_unavailable', 'Neuro Notes authentication is unavailable')
  }
  if (!result.response.ok || !result.data.access_token || !result.data.refresh_token) {
    throw marketplaceError(event, result.response.status === 401 ? 401 : 502, result.data.code || 'totp_failed', result.data.detail || 'TOTP verification failed')
  }
  await destroySession(event)
  await createSession(event, {
    kind: 'authenticated',
    accessToken: result.data.access_token,
    refreshToken: result.data.refresh_token
  })
  return { authenticated: true }
})
