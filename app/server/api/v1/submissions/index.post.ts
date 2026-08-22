import { submissionInputSchema } from '#shared/marketplace'
import { createSubmission } from '#server/services/marketplace'
import { marketplaceError, readValidatedJson } from '#server/utils/errors'
import { validateGitHubPlugin } from '#server/utils/github'
import { requireUser } from '#server/utils/neuro-notes-auth'
import { enforceRateLimit, requireCsrf } from '#server/utils/security'

export default defineEventHandler(async (event) => {
  requireCsrf(event)
  const user = await requireUser(event, { verified: true })
  await enforceRateLimit(event, 'submission', String(user.id), 10, 60 * 60)
  const input = await readValidatedJson(event, value => submissionInputSchema.safeParse(value))
  let validated
  try {
    validated = await validateGitHubPlugin(event, input)
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw marketplaceError(event, 502, 'github_unavailable', 'GitHub validation is unavailable')
  }
  const submission = await createSubmission(event, user.id, input, validated)
  setResponseStatus(event, 201)
  return submission
})
