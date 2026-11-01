import { describe, expect, it } from 'vitest'

import { getMetrics, observe } from './observability'
import { evaluateUserImpactAlerts } from './alerts'

describe('observability', () => {
  it('records correlated success and failure metrics without payloads', async () => {
    await observe('test_operation', async () => 'ok')
    await expect(
      observe('test_operation', async () => {
        throw new Error('expected')
      }),
    ).rejects.toThrow('expected')

    expect(getMetrics().test_operation).toMatchObject({
      attempts: 2,
      successes: 1,
      failures: 1,
    })
    expect(getMetrics().test_operation.lastTraceId).toEqual(expect.any(String))
    expect(evaluateUserImpactAlerts(0.5)).toEqual([
      expect.objectContaining({ operation: 'test_operation', failureRate: 0.5 }),
    ])
  })
})
