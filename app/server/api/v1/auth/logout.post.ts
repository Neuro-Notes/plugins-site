import { backendRequest } from '#server/utils/neuro-notes-auth'
import { destroySession, readSession } from '#server/utils/session'
import { clearCsrf, requireCsrf } from '#server/utils/security'

export default defineEventHandler(async (event) => {
  requireCsrf(event)
  const stored = await readSession(event)
  await destroySession(event)
  clearCsrf(event)
  if (stored?.data.kind === 'authenticated') {
    await backendRequest('/auth/logout', {
      method: 'POST',
      headers: { authorization: `Bearer ${stored.data.refreshToken}` }
    }).catch(() => undefined)
  }
  setResponseStatus(event, 204)
  return null
})
