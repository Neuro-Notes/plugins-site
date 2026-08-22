import { listPlugins } from '#server/services/marketplace'

export default defineEventHandler(async event => await listPlugins(getQuery(event)))
