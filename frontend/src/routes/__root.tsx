import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

const grafanaDashboardUrl =
  'http://localhost:3001/d/flashcard-overview/flashcard-generator-overview'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'theme-color',
        content: '#101b3c',
      },
      {
        title: 'Flashcard Generator — Make every idea stick',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="app-shell">
          <header className="site-header">
            <nav aria-label="Main navigation" className="site-nav">
              <Link aria-label="Flashcard Generator home" className="brand" to="/">
                <span aria-hidden="true" className="brand-mark">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="brand-name">
                  Flashcard <strong>Generator</strong>
                </span>
              </Link>
              <div className="nav-links">
                <Link className="nav-link" to="/">
                  Home
                </Link>
                <Link className="nav-link" to="/input">
                  Create
                </Link>
                <Link className="nav-link" to="/decks">
                  Decks
                </Link>
  
              </div>
              <a
                className="grafana-link"
                href={grafanaDashboardUrl}
                rel="noreferrer"
                target="_blank"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M4 19V9m5 10V5m5 14v-7m5 7V3" />
                </svg>
                Grafana
                <svg aria-hidden="true" className="external-icon" viewBox="0 0 24 24">
                  <path d="M14 5h5v5m0-5-9 9M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
                </svg>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </nav>
          </header>
          <main id="main-content">{children}</main>
          <footer className="site-footer">
            <span>From scattered notes to lasting knowledge.</span>
            <span>Basic · Cloze · Anki-ready</span>
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
