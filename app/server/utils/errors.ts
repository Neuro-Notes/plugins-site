import type { H3Event } from 'h3'

export interface MarketplaceErrorData {
  detail: string
  code: string
  request_id?: string
  errors?: string[]
}

export const marketplaceError = (
  event: H3Event,
  statusCode: number,
  code: string,
  detail: string,
  errors?: string[]
) => createError({
  statusCode,
  statusMessage: detail,
  data: {
    detail,
    code,
    request_id: event.context.requestId,
    ...(errors?.length ? { errors } : {})
  } satisfies MarketplaceErrorData
})

export const readValidatedJson = async <T>(
  event: H3Event,
  parse: (input: unknown) => { success: true, data: T } | { success: false, error: { issues: Array<{ path: PropertyKey[], message: string }> } }
): Promise<T> => {
  const result = parse(await readBody(event))
  if (result.success) return result.data
  throw marketplaceError(
    event,
    422,
    'validation_error',
    'Request validation failed',
    result.error.issues.map(issue => `${issue.path.join('.') || 'body'}: ${issue.message}`)
  )
}
