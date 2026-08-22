import type { PluginManifest } from './manifest'

export type CompatibilityWarningCode =
  | 'runtime-system-community'
  | 'runtime-iframe-disabled'
  | 'settings-ui-unavailable'
  | 'ai-tools-experimental'
  | 'markdown-extensions-unavailable'
  | 'note-types-unavailable'
  | 'views-unavailable'
  | 'vault-api-unavailable'
  | 'network-api-unavailable'
  | 'clipboard-api-unavailable'
  | 'editor-api-unavailable'
  | 'native-api-unavailable'

export interface CompatibilityWarning {
  code: CompatibilityWarningCode
  field: string
}

export const compatibilityWarnings = (manifest: PluginManifest): CompatibilityWarning[] => {
  const warnings: CompatibilityWarning[] = []
  const add = (code: CompatibilityWarningCode, field: string) => warnings.push({ code, field })

  if (manifest.runtime === 'system') add('runtime-system-community', 'runtime')
  if (manifest.runtime === 'iframe') add('runtime-iframe-disabled', 'runtime')
  if (manifest.contributes?.settings) add('settings-ui-unavailable', 'contributes.settings')
  if (manifest.contributes?.aiTools?.length) add('ai-tools-experimental', 'contributes.aiTools')
  if (manifest.contributes?.markdownExtensions) add('markdown-extensions-unavailable', 'contributes.markdownExtensions')
  if (manifest.contributes?.noteTypes?.length) add('note-types-unavailable', 'contributes.noteTypes')
  if (manifest.contributes?.views?.length) add('views-unavailable', 'contributes.views')
  if (manifest.permissions?.vault) add('vault-api-unavailable', 'permissions.vault')
  if (manifest.permissions?.network?.length) add('network-api-unavailable', 'permissions.network')
  if (manifest.permissions?.clipboard) add('clipboard-api-unavailable', 'permissions.clipboard')
  if (manifest.permissions?.editor) add('editor-api-unavailable', 'permissions.editor')
  if (manifest.permissions?.native?.length) add('native-api-unavailable', 'permissions.native')

  return warnings
}

export const permissionKeys = (manifest: PluginManifest): string[] => {
  const keys: string[] = []
  const vault = manifest.permissions?.vault
  if (vault?.read?.length) keys.push('vault:read')
  if (vault?.write?.length) keys.push('vault:write')
  if (vault?.delete?.length) keys.push('vault:delete')
  if (vault?.watch?.length) keys.push('vault:watch')
  if (manifest.permissions?.network?.length) keys.push('network:fetch')
  if (manifest.permissions?.ai) keys.push('ai:use')
  const clipboard = manifest.permissions?.clipboard
  if (clipboard === true || (typeof clipboard === 'object' && clipboard.read)) keys.push('clipboard:read')
  if (clipboard === true || (typeof clipboard === 'object' && clipboard.write)) keys.push('clipboard:write')
  if (manifest.permissions?.editor?.read) keys.push('editor:read')
  if (manifest.permissions?.editor?.write) keys.push('editor:write')
  if (manifest.permissions?.native?.length) keys.push('native:use')
  return keys
}
