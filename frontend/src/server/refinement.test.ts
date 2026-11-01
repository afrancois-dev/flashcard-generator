import { describe, expect, it } from 'vitest'

import type { AiProvider } from './ai-provider'
import { refineCardWithProvider } from './refinement'

describe('refineCardWithProvider', () => {
  it('returns the refined card while preserving its id', async () => {
    const provider: AiProvider = {
      generateCards: async () => ({
        cards: [
          {
            id: 'generated-id',
            type: 'basic',
            front: 'Short question',
            back: 'Short answer',
            tags: [],
          },
        ],
      }),
    }

    await expect(
      refineCardWithProvider(provider, {
        card: {
          id: 'original-id',
          type: 'basic',
          front: 'Long question',
          back: 'Long answer',
          tags: [],
        },
        instruction: 'Make it concise.',
      }),
    ).resolves.toMatchObject({ id: 'original-id', front: 'Short question' })
  })
})
