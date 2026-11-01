import { trace } from '@opentelemetry/api'

import {
  emitStructuredLog,
  recordOperation,
} from './telemetry'

type Metric = {
  attempts: number
  successes: number
  failures: number
  lastTraceId?: string
}

const metrics = new Map<string, Metric>()

export async function observe<T>(
  operation: string,
  action: (traceId: string) => Promise<T>,
): Promise<T> {
  const tracer = trace.getTracer('flashcard-generator')
  const metric = metrics.get(operation) ?? {
    attempts: 0,
    successes: 0,
    failures: 0,
  }
  metric.attempts += 1
  metrics.set(operation, metric)
  const startedAt = Date.now()
  return tracer.startActiveSpan(`operation.${operation}`, async (span) => {
    const traceId = span.spanContext().traceId
    metric.lastTraceId = traceId
    emitStructuredLog('operation.started', { operation })

    try {
      const result = await action(traceId)
      const durationMs = Date.now() - startedAt
      metric.successes += 1
      recordOperation(operation, 'success', durationMs)
      span.setAttribute('operation', operation)
      span.setAttribute('status', 'success')
      emitStructuredLog('operation.completed', {
        operation,
        durationMs,
        success: true,
        status: 'success',
      })
      return result
    } catch (error) {
      const durationMs = Date.now() - startedAt
      metric.failures += 1
      recordOperation(operation, 'error', durationMs)
      span.setAttribute('operation', operation)
      span.setAttribute('status', 'error')
      span.recordException(error instanceof Error ? error : new Error('UnknownError'))
      emitStructuredLog('operation.completed', {
        operation,
        durationMs,
        success: false,
        status: 'error',
        errorType: error instanceof Error ? error.name : 'UnknownError',
      })
      throw error
    } finally {
      span.end()
    }
  })
}

export function getMetrics(): Record<string, Metric> {
  return Object.fromEntries(
    [...metrics.entries()].map(([operation, metric]) => [
      operation,
      { ...metric },
    ]),
  )
}
