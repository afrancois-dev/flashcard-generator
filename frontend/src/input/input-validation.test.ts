import { describe, expect, it } from 'vitest'

import { validateSourceInput } from './input-validation'

describe('validateSourceInput', () => {
  it('requires source text in text mode', () => {
    expect(validateSourceInput('text', '  ')).toBe(
      'Paste source text before continuing.',
    )
  })

  it('requires a prompt in prompt mode', () => {
    expect(validateSourceInput('prompt', '')).toBe(
      'Enter a prompt before continuing.',
    )
  })

  it('accepts non-empty input', () => {
    expect(validateSourceInput('text', 'Study notes')).toBeNull()
  })

  it('rejects oversized input', () => {
    expect(validateSourceInput('text', 'x'.repeat(100_001))).toContain(
      'characters or fewer',
    )
  })
})
