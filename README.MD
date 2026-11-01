# Anki Flashcard Generator

Anki Flashcard Generator turns pasted notes, uploaded documents, web pages, or
direct prompts into editable Anki flashcards. Users can review and refine basic
and cloze cards, then export them as CSV, TXT, or an Anki `.apkg` package.

## Architecture

- **Frontend:** React with TanStack Start, TanStack Router, TanStack Table, and
  client-side review state.
- **Server boundary:** TanStack server functions for AI calls, document
  extraction, URL fetching, validation, and refinement.
- **Shared domain:** Zod-validated basic and cloze card contracts.
- **Exports:** Browser-side CSV/TXT and APKG generation.

The current MVP keeps review drafts in browser memory. Persistent storage,
containerization, deployment, and operational telemetry are tracked in the
evaluation follow-up issues.

## Local development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the validation suite and production build:

```bash
npm test
npm run generate-routes
npm run build
```

Run the complete containerized application with persistent SQLite storage:

```bash
docker compose up --build
```

Stop it while preserving the database volume:

```bash
docker compose down
```

Remove the database volume as well:

```bash
docker compose down -v
```

## Product workflow

1. Open **Input** and paste source text or provide a prompt.
2. Upload a `.pdf`, `.txt`, `.md`, or `.docx` document, or load an HTTP(S)
   article URL.
3. Generate and review basic or cloze cards.
4. Edit fields and tags, add or delete cards, and request AI refinement.
5. Export the reviewed collection as CSV, TXT, or APKG.

AI generation requires `AI_API_KEY`, `AI_API_URL`, and `AI_MODEL` in the server
environment. Never commit these values or send source content to telemetry.

## Project documentation and tracking

- [Product and architecture scope](_docs/plan.md)
- [Implementation tasks](_docs/tasks.md)
- [Evaluation criteria](_docs/evaluation_criteria.md)
- [Evaluation scorecard](_docs/evaluation-scorecard.md)
- [Public GitHub issue tracker](https://github.com/afrancois-dev/flashcard-generator/issues)
- [Contributor instructions](AGENTS.MD)

## Current evaluation status

The original MVP backlog is complete. Remaining infrastructure and operations
work is tracked by umbrella issue
[#18](https://github.com/afrancois-dev/flashcard-generator/issues/18) and its
focused follow-ups.

## CI/CD

Pull requests run tests, route generation, the production build, and Compose
configuration validation through `.github/workflows/ci.yml`. Pushes to `main`
publish a versioned image to GHCR and trigger the configured development
deployment hook through `.github/workflows/deploy.yml`.

The **Metrics** route displays aggregated operation counts. Server operations
emit JSON logs with a trace ID and record success/failure counters without
recording prompts, documents, card content, credentials, or API responses.
User-impact alert payloads can dispatch `.github/workflows/alert-responder.yml`;
the bounded responder records a human-actionable incident and deliberately does
not modify application data automatically.

The development environment must provide `DEVELOPMENT_DEPLOY_HOOK` as a
protected GitHub environment secret. To roll back, manually run the Deploy
development image workflow with a previously published `sha-<commit>` image
tag. Production promotion remains intentionally environment-specific and must
be configured as a protected manual environment.

No hosting target is configured in this repository yet, so the public
deployment criterion remains explicitly blocked rather than represented as a
fake URL. Configure the protected deployment hook before relying on the
development workflow.