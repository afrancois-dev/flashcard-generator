import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HealthCheck } from './health-check'

describe('HealthCheck', () => {
  it('renders the application readiness message', () => {
    const markup = renderToStaticMarkup(<HealthCheck />)

    expect(markup).toContain('Flashcard Generator')
    expect(markup).toContain('The application is ready.')
  })
})
