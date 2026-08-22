import { currentUser } from '#server/utils/neuro-notes-auth'
import { ensureCsrf } from '#server/utils/security'

export default defineEventHandler(async event => ({
  authenticated: Boolean(await currentUser(event)),
  user: event.context.user || null,
  csrfToken: ensureCsrf(event)
}))
