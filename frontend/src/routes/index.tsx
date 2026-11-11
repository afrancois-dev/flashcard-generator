import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <section className="home-page">
      <div className="home-hero">
        <div className="home-hero-copy">
          <p className="hero-badge">
            <span aria-hidden="true" /> AI-powered study workspace
          </p>
          <h1>
            Less rereading.
            <span>More remembering.</span>
          </h1>
          <p className="home-hero-lede">
            Turn dense notes, documents, and ideas into a focused deck of
            flashcards. You bring the curiosity—we&apos;ll help with the cards.
          </p>
          <div className="cluster home-hero-actions">
            <Link className="button button-primary" to="/input">
              Create your deck
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
            <Link className="button button-secondary" to="/review">
              Explore your cards
            </Link>
          </div>
          <div className="hero-features" aria-label="Product highlights">
            <span>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m5 12 4 4L19 6" />
              </svg>
              AI-assisted
            </span>
            <span>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m5 12 4 4L19 6" />
              </svg>
              Fully editable
            </span>
            <span>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m5 12 4 4L19 6" />
              </svg>
              Anki-ready
            </span>
          </div>
        </div>

        <div aria-hidden="true" className="hero-deck-scene">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-deck-card hero-deck-card-back">
            <span>02 / 10</span>
          </div>
          <div className="hero-deck-card hero-deck-card-middle">
            <span>01 / 10</span>
          </div>
          <div className="hero-deck-card hero-deck-card-front">
            <div className="hero-card-topline">
              <span>BIOLOGY</span>
              <span className="hero-card-number">01</span>
            </div>
            <div>
              <p className="hero-card-kicker">QUESTION</p>
              <p className="hero-card-question">
                What is the powerhouse of the cell?
              </p>
            </div>
            <div className="hero-card-bottom">
              <span>Tap to reveal</span>
              <span className="hero-card-flip">
                <svg viewBox="0 0 24 24">
                  <path d="M20 11a8 8 0 0 0-14.9-4M4 4v4h4m-4 2a8 8 0 0 0 14.9 4m.1 6v-4h-4" />
                </svg>
              </span>
            </div>
          </div>
          <div className="hero-floating-tag hero-floating-tag-top">
            <svg viewBox="0 0 24 24">
              <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z" />
            </svg>
            Made to stick
          </div>
          <div className="hero-floating-tag hero-floating-tag-bottom">
            <span className="mini-progress"><span /></span>
            Deck progress <strong>70%</strong>
          </div>
        </div>
      </div>

      <section aria-labelledby="workspace-actions-heading" className="home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A simpler study ritual</p>
            <h2 id="workspace-actions-heading">From source to session in three steps.</h2>
            <p>Spend less time formatting and more time learning.</p>
          </div>
          <Link className="text-link" to="/input">
            Start creating <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="action-grid">
          <Link className="action-card" to="/input">
            <div className="action-card-heading">
              <span className="action-icon action-icon-source">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6M8 13h8m-8 4h5" />
                </svg>
              </span>
              <span className="action-number">01</span>
            </div>
            <span className="action-card-title">Bring your material</span>
            <span className="action-card-copy">
              Paste notes, upload a document, import a web page, or start with a prompt.
            </span>
            <span className="action-card-link">
              Add a source <span aria-hidden="true">→</span>
            </span>
          </Link>
          <Link className="action-card action-card-primary" to="/review">
            <div className="action-card-heading">
              <span className="action-icon action-icon-review">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect height="14" rx="2" width="12" x="7" y="5" />
                  <path d="M5 8H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h1m14-11h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1" />
                </svg>
              </span>
              <span className="action-number">02</span>
            </div>
            <span className="action-card-title">Shape your deck</span>
            <span className="action-card-copy">
              Swipe through your cards, flip to reveal answers, and refine every detail.
            </span>
            <span className="action-card-link">
              Preview the experience <span aria-hidden="true">→</span>
            </span>
          </Link>
          <Link className="action-card" to="/export">
            <div className="action-card-heading">
              <span className="action-icon action-icon-export">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 3v12m-5-5 5 5 5-5M5 21h14a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2" />
                </svg>
              </span>
              <span className="action-number">03</span>
            </div>
            <span className="action-card-title">Learn anywhere</span>
            <span className="action-card-copy">
              Export a polished Anki package or take a lightweight CSV or TXT copy.
            </span>
            <span className="action-card-link">
              Choose a format <span aria-hidden="true">→</span>
            </span>
          </Link>
        </div>
      </section>

      <section className="home-footer-band" aria-label="Study inspiration">
        <div>
          <p className="eyebrow">Small cards. Lasting knowledge.</p>
          <p className="home-footer-copy">One good question at a time.</p>
        </div>
        <Link className="button button-secondary" to="/input">
          Turn notes into knowledge
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </Link>
      </section>
    </section>
  )
}
