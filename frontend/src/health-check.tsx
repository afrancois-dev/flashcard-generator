export function HealthCheck() {
  return (
    <section className="page page-narrow">
      <div className="page-header">
        <h1>Flashcard Generator</h1>
        <p>The application is ready.</p>
      </div>
      <div className="surface status status-success" role="status">
        Ready to create and review flashcards.
      </div>
    </section>
  )
}
