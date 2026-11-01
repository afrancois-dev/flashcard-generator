import { describe, expect, it } from 'vitest'

import { serializeCsv, serializeTxt } from './text-export'

const collection = {
  cards: [
    {
      id: 'basic-1',
      type: 'basic' as const,
      front: 'Question, with comma',
      back: 'Answer "quoted"',
      tags: ['study', 'biology'],
    },
    {
      id: 'cloze-1',
      type: 'cloze' as const,
      text: 'The {{c1::cell}} is basic.',
      tags: [],
    },
  ],
}

describe('text export', () => {
  it('escapes CSV fields and preserves cloze content', () => {
    expect(serializeCsv(collection)).toBe(
      '"Front","Back","Tags"\n' +
        '"Question, with comma","Answer ""quoted""","study biology"\n' +
        '"The {{c1::cell}} is basic.","",""',
    )
  })

  it('serializes cards as tab-separated text', () => {
    expect(serializeTxt(collection)).toBe(
      'Question, with comma\tAnswer "quoted"\tstudy biology\n' +
        'The {{c1::cell}} is basic.\t\t',
    )
  })
})
