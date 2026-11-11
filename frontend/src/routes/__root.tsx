import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

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
        title: 'Flashcard Generator',
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
        <div className="app-shell">
          <header className="site-header">
            <nav aria-label="Main navigation" className="site-nav">
              <Link className="brand" to="/">Flashcard Generator</Link>
              <Link className="nav-link" to="/">Home</Link>
              <Link className="nav-link" to="/input">Input</Link>
              <Link className="nav-link" to="/review">Review</Link>
              <Link className="nav-link" to="/export">Export</Link>
              <Link className="nav-link" to="/observability">Metrics</Link>
            </nav>
          </header>
          <main>{children}</main>
          <Scripts />
        </div>
      </body>
    </html>
  )
}
