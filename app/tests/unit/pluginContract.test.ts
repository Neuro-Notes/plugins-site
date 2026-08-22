import { describe, expect, it } from 'vitest'
import { compatibilityWarnings, permissionKeys } from '#shared/plugin-contract/capabilities'
import {
  normalizeReleaseVersion,
  parsePluginManifestJson,
  validatePluginManifest
} from '#shared/plugin-contract/manifest'

const workingManifest = {
  id: 'daily-notes',
  name: 'Daily Notes',
  version: '1.2.0',
  apiVersion: '1',
  runtime: 'worker',
  entry: 'main.js',
  activationEvents: ['onStartupFinished'],
  contributes: {
    commands: [{ id: 'daily-notes.create', title: 'Create daily note' }]
  }
}

describe('plugin manifest contract', () => {
  it('accepts and normalizes the working Worker subset', () => {
    const result = validatePluginManifest(workingManifest)
    expect(result.errors).toEqual([])
    expect(result.manifest).toMatchObject({ id: 'daily-notes', runtime: 'worker' })
    expect(compatibilityWarnings(result.manifest!)).toEqual([])
  })

  it('rejects path traversal and unsupported API versions', () => {
    const result = validatePluginManifest({ ...workingManifest, apiVersion: '2', entry: '../main.js' })
    expect(result.manifest).toBeNull()
    expect(result.errors.join(' ')).toContain('apiVersion')
    expect(result.errors.join(' ')).toContain('entry')
  })

  it('returns a stable parse error for malformed JSON', () => {
    expect(parsePluginManifestJson('{bad').errors).toEqual(['manifest: Manifest is not valid JSON'])
  })

  it('warns without rejecting schema-valid planned capabilities', () => {
    const result = validatePluginManifest({
      ...workingManifest,
      runtime: 'iframe',
      contributes: { ...workingManifest.contributes, settings: true, views: ['calendar'] },
      permissions: { network: ['https://api.example.com'], vault: { read: ['Notes/**/*.md'] } }
    })
    expect(result.manifest).not.toBeNull()
    expect(compatibilityWarnings(result.manifest!).map(item => item.code)).toEqual(expect.arrayContaining([
      'runtime-iframe-disabled',
      'settings-ui-unavailable',
      'views-unavailable',
      'network-api-unavailable',
      'vault-api-unavailable'
    ]))
    expect(permissionKeys(result.manifest!)).toEqual(['vault:read', 'network:fetch'])
  })

  it('accepts a leading v in GitHub release tags', () => {
    expect(normalizeReleaseVersion('v1.2.0')).toBe('1.2.0')
    expect(normalizeReleaseVersion('1.2.0')).toBe('1.2.0')
  })
})
