import { describe, expect, it } from 'vitest'
import { marketplaceCategories, submissionInputSchema } from '#shared/marketplace'

describe('submission input', () => {
  it('accepts optional localized copy and no more than three known categories', () => {
    const result = submissionInputSchema.parse({
      repositoryUrl: 'https://github.com/Neuro-Notes/plugin',
      releaseTag: 'v1.0.0',
      categories: marketplaceCategories.slice(0, 3),
      translations: { ru: { summary: 'Краткое описание' } }
    })
    expect(result.manifestPath).toBe('manifest.json')
    expect(result.kind).toBe('new_plugin')
  })

  it('rejects unknown or excessive categories', () => {
    expect(() => submissionInputSchema.parse({
      repositoryUrl: 'https://github.com/Neuro-Notes/plugin',
      releaseTag: 'v1.0.0',
      categories: ['ai', 'editor', 'utilities', 'other']
    })).toThrow()
  })
})
