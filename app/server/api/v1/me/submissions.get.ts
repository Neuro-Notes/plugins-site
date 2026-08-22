import { listSubmissions } from '#server/services/marketplace'
import { requireUser } from '#server/utils/neuro-notes-auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return { items: await listSubmissions({ userId: user.id }) }
})
