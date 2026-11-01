import { getMetrics } from './observability'

export type UserImpactAlert = {
  operation: string
  failureRate: number
  traceId?: string
}

export function evaluateUserImpactAlerts(
  threshold = 0.5,
): UserImpactAlert[] {
  return Object.entries(getMetrics())
    .map(([operation, metric]) => ({
      operation,
      failureRate:
        metric.attempts === 0 ? 0 : metric.failures / metric.attempts,
      traceId: metric.lastTraceId,
    }))
    .filter(
      (alert) =>
        alert.failureRate >= threshold &&
        alert.failureRate > 0,
    )
}
