import { listSubmissions } from '#server/services/marketplace'
import { requireUser } from '#server/utils/neuro-notes-auth'

export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  const status = typeof getQuery(event).status === 'string' ? String(getQuery(event).status) : undefined
  return { items: await listSubmissions({ status }) }
})
