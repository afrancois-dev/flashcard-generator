import { randomUUID } from 'node:crypto'

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
  const traceId = randomUUID()
  const metric = metrics.get(operation) ?? {
    attempts: 0,
    successes: 0,
    failures: 0,
  }
  metric.attempts += 1
  metric.lastTraceId = traceId
  metrics.set(operation, metric)
  const startedAt = Date.now()
  console.log(JSON.stringify({ event: 'operation.started', operation, traceId }))

  try {
    const result = await action(traceId)
    metric.successes += 1
    console.log(
      JSON.stringify({
        event: 'operation.completed',
        operation,
        traceId,
        durationMs: Date.now() - startedAt,
        success: true,
      }),
    )
    return result
  } catch (error) {
    metric.failures += 1
    console.error(
      JSON.stringify({
        event: 'operation.completed',
        operation,
        traceId,
        durationMs: Date.now() - startedAt,
        success: false,
        errorType: error instanceof Error ? error.name : 'UnknownError',
      }),
    )
    throw error
  }
}

export function getMetrics(): Record<string, Metric> {
  return Object.fromEntries(
    [...metrics.entries()].map(([operation, metric]) => [
      operation,
      { ...metric },
    ]),
  )
}
