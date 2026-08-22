import { z } from 'zod'
import { decideSubmission } from '#server/services/marketplace'
import { readValidatedJson } from '#server/utils/errors'
import { requireUser } from '#server/utils/neuro-notes-auth'
import { enforceRateLimit, requireCsrf } from '#server/utils/security'

const decisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().trim().max(2000).default('')
})

export default defineEventHandler(async (event) => {
  requireCsrf(event)
  const user = await requireUser(event, { admin: true })
  await enforceRateLimit(event, 'moderation', String(user.id), 60, 60 * 60)
  const body = await readValidatedJson(event, value => decisionSchema.safeParse(value))
  return await decideSubmission(event, getRouterParam(event, 'id') || '', user.id, body.decision, body.reason)
})
