import { ensureCsrf } from '#server/utils/security'

export default defineEventHandler(event => ({ csrfToken: ensureCsrf(event) }))
