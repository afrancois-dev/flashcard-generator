import { logs, metrics, trace } from '@opentelemetry/api'

const serviceName = process.env.OTEL_SERVICE_NAME ?? 'flashcard-generator'
const meter = metrics.getMeter(serviceName)
const operationCounter = meter.createCounter('flashcard_operation_total', {
  description: 'Completed flashcard server operations',
})
const operationDuration = meter.createHistogram(
  'flashcard_operation_duration_ms',
  { description: 'Flashcard server operation duration in milliseconds' },
)

export function recordOperation(
  operation: string,
  status: 'success' | 'error',
  durationMs: number,
): void {
  operationCounter.add(1, { operation, status })
  operationDuration.record(durationMs, { operation, status })
}

export function emitStructuredLog(
  event: 'operation.started' | 'operation.completed',
  attributes: Record<string, string | number | boolean>,
): void {
  const spanContext = trace.getActiveSpan()?.spanContext()
  const correlation = spanContext
    ? { traceId: spanContext.traceId, spanId: spanContext.spanId }
    : {}
  const payload = { event, ...attributes, ...correlation }
  const level =
    event === 'operation.completed' && attributes.success === false
      ? 'ERROR'
      : 'INFO'

  logs.getLogger(serviceName).emit({
    severityText: level,
    body: event,
    attributes: payload,
  })
  const write = level === 'ERROR' ? console.error : console.log
  write(JSON.stringify(payload))
}
