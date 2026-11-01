import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { getObservabilityMetrics } from '../server/metrics'

export const Route = createFileRoute('/observability')({
  component: ObservabilityPage,
})

function ObservabilityPage() {
  const [metrics, setMetrics] = useState<Record<string, unknown>>({})

  useEffect(() => {
    void getObservabilityMetrics().then(setMetrics)
  }, [])

  return (
    <section className="page page-narrow">
      <div className="page-header">
        <h1>Operational metrics</h1>
        <p>Aggregated operation counts only; source content is never displayed.</p>
      </div>
      <div className="surface">
        <pre className="metrics-output" aria-label="Aggregated operational metrics">{JSON.stringify(metrics, null, 2)}</pre>
      </div>
    </section>
  )
}
