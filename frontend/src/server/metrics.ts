import { createServerFn } from '@tanstack/react-start'

import { evaluateUserImpactAlerts } from './alerts'
import { getMetrics } from './observability'

export const getObservabilityMetrics = createServerFn({ method: 'GET' }).handler(
  () => ({
    metrics: getMetrics(),
    alerts: evaluateUserImpactAlerts(),
  }),
)
