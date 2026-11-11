import { createFileRoute } from '@tanstack/react-router'

import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <section className="home-page">
      <div className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">Study studio</p>
          <h1>Turn your notes into cards worth remembering.</h1>
          <p className="home-hero-lede">
            Build a focused study set from notes, documents, or a prompt. Keep
            the useful parts, refine the rest, and export when it is ready.
          </p>
          <div className="cluster">
            <Link className="button button-primary" to="/input">
              Create a card set
            </Link>
            <Link className="button button-secondary" to="/review">
              Open review
            </Link>
          </div>
        </div>
        <aside className="home-status" aria-label="Workspace status">
          <p className="panel-kicker">Workspace status</p>
          <div className="status-line">
            <span aria-hidden="true" className="status-dot" />
            Ready to build
          </div>
          <p className="home-status-copy">
            Your next study set starts with one good source.
          </p>
          <div className="status-detail">
            <span>Current set</span>
            <strong>New workspace</strong>
          </div>
          <div className="status-detail">
            <span>Cards ready</span>
            <strong>0</strong>
          </div>
        </aside>
      </div>

      <section aria-labelledby="workspace-actions-heading" className="home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your workspace</p>
            <h2 id="workspace-actions-heading">Pick up where your thinking is.</h2>
          </div>
          <span className="section-rule" aria-hidden="true" />
        </div>
        <div className="action-grid">
          <Link className="action-card action-card-primary" to="/input">
            <span className="action-number">01</span>
            <span className="action-card-title">Start with source material</span>
            <span className="action-card-copy">Paste notes, upload a document, or bring in a page.</span>
            <span className="action-arrow" aria-hidden="true">-&gt;</span>
          </Link>
          <Link className="action-card" to="/review">
            <span className="action-number">02</span>
            <span className="action-card-title">Shape the cards</span>
            <span className="action-card-copy">Edit fronts and backs, add cards, and refine the set.</span>
            <span className="action-arrow" aria-hidden="true">-&gt;</span>
          </Link>
          <Link className="action-card" to="/export">
            <span className="action-number">03</span>
            <span className="action-card-title">Take them with you</span>
            <span className="action-card-copy">Export a finished set for Anki or a quick text import.</span>
            <span className="action-arrow" aria-hidden="true">-&gt;</span>
          </Link>
        </div>
      </section>

      <section className="home-footer-band" aria-label="Study set summary">
        <div>
          <p className="eyebrow">A small ritual</p>
          <p className="home-footer-copy">Read closely. Keep the signal. Review often.</p>
        </div>
        <div className="home-footer-meta">
          <span>Basic cards</span>
          <span>Cloze cards</span>
          <span>CSV / TXT / APKG</span>
        </div>
      </section>
    </section>
  )
}
