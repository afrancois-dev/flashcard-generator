import { createFileRoute } from '@tanstack/react-router'

import { HealthCheck } from '../health-check'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return <HealthCheck />
}
