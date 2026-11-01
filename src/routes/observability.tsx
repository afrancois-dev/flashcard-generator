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
    <section>
      <h1>Operational metrics</h1>
      <p>Aggregated operation counts only; source content is never displayed.</p>
      <pre>{JSON.stringify(metrics, null, 2)}</pre>
    </section>
  )
}
