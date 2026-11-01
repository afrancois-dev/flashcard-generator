const input = process.env.ALERT_PAYLOAD

if (!input) {
  console.error('ALERT_PAYLOAD is required')
  process.exit(1)
}

let alert
try {
  alert = JSON.parse(input)
} catch {
  console.error('ALERT_PAYLOAD must be valid JSON')
  process.exit(1)
}

const incident = {
  event: 'responder.agent_action',
  traceId: alert.traceId ?? 'unknown',
  operation: alert.operation ?? 'unknown',
  action: 'created-human-actionable-incident',
  reason: 'Automated remediation is disabled for application data safety.',
  timestamp: new Date().toISOString(),
}

console.log(JSON.stringify(incident))
