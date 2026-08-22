import { describe, expect, it } from 'vitest'
import { isSafeRepositoryPath, parseGitHubRepositoryUrl } from '#server/utils/github'

describe('GitHub validation boundary', () => {
  it('parses only a canonical public GitHub repository URL', () => {
    expect(parseGitHubRepositoryUrl('https://github.com/Neuro-Notes/neuro-notes-plugin.git')).toEqual({
      owner: 'Neuro-Notes',
      repository: 'neuro-notes-plugin'
    })
    expect(parseGitHubRepositoryUrl('https://github.com/Neuro-Notes/neuro-notes-plugin/issues')).toBeNull()
    expect(parseGitHubRepositoryUrl('https://user@github.com/Neuro-Notes/plugin')).toBeNull()
    expect(parseGitHubRepositoryUrl('http://github.com/Neuro-Notes/plugin')).toBeNull()
    expect(parseGitHubRepositoryUrl('https://github.example/GigantPro/plugin')).toBeNull()
  })

  it('rejects manifest and entry paths that can escape the repository', () => {
    expect(isSafeRepositoryPath('manifest.json')).toBe(true)
    expect(isSafeRepositoryPath('plugin/manifest.json')).toBe(true)
    expect(isSafeRepositoryPath('../manifest.json')).toBe(false)
    expect(isSafeRepositoryPath('plugin/../manifest.json')).toBe(false)
    expect(isSafeRepositoryPath('/manifest.json')).toBe(false)
    expect(isSafeRepositoryPath('plugin\\manifest.json')).toBe(false)
  })
})
