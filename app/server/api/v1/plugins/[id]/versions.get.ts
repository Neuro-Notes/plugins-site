import { getPlugin, listPluginVersions } from '#server/services/marketplace'
import { marketplaceError } from '#server/utils/errors'

export default defineEventHandler(async (event) => {
  const pluginId = getRouterParam(event, 'id') || ''
  if (!await getPlugin(pluginId, getQuery(event).locale)) {
    throw marketplaceError(event, 404, 'plugin_not_found', 'Plugin not found')
  }
  return { items: await listPluginVersions(pluginId) }
})
