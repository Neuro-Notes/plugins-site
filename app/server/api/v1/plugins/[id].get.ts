import { getPlugin } from '#server/services/marketplace'
import { marketplaceError } from '#server/utils/errors'

export default defineEventHandler(async (event) => {
  const pluginId = getRouterParam(event, 'id') || ''
  const plugin = await getPlugin(pluginId, getQuery(event).locale)
  if (!plugin) throw marketplaceError(event, 404, 'plugin_not_found', 'Plugin not found')
  return plugin
})
