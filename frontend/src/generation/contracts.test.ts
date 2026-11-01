import { describe, expect, it } from 'vitest'

import {
  generationRequestSchema,
  parseCardGenerationResponse,
} from './contracts'

describe('generation contracts', () => {
  it('accepts a valid generation request', () => {
    const result = generationRequestSchema.safeParse({
      source: { mode: 'text', content: 'Study notes' },
      cardTypes: ['basic', 'cloze'],
      requestedCount: 10,
    })

    expect(result.success).toBe(true)
  })

  it('parses valid JSON card output', () => {
    const result = parseCardGenerationResponse(
      JSON.stringify({
        cards: [
          {
            id: 'basic-1',
            type: 'basic',
            front: 'Question',
            back: 'Answer',
            tags: [],
          },
        ],
      }),
    )

    expect(result.success).toBe(true)
  })

  it('reports malformed provider output', () => {
    const result = parseCardGenerationResponse('not-json')

    expect(result).toEqual({
      success: false,
      errors: ['response: AI output is not valid JSON.'],
    })
  })
})
