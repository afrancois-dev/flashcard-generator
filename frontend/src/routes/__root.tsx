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
        title: 'TanStack Start Starter',
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
        <header>
          <nav aria-label="Main navigation">
            <Link to="/">Home</Link>
            <Link to="/input">Input</Link>
            <Link to="/review">Review</Link>
            <Link to="/export">Export</Link>
            <Link to="/observability">Metrics</Link>
          </nav>
        </header>
        <main>{children}</main>

        <Scripts />
      </body>
    </html>
  )
}
