# Anki Flashcard Generator

Anki Flashcard Generator turns pasted notes, uploaded documents, web pages, or
direct prompts into editable Anki flashcards. Users can review and refine basic
and cloze cards, then export them as CSV, TXT, or an Anki `.apkg` package.

## Architecture

- **Frontend:** The root `frontend/` directory contains the React application
  with TanStack Start, TanStack Router, TanStack Table, and client-side review
  state.
- **Server boundary:** TanStack server functions are a thin browser-facing
  façade that validates UI input and forwards requests to FastAPI.
- **Python backend:** FastAPI owns generation, refinement, collection
  persistence, URL extraction, and the versioned API contracts on port `8000`.
- **Shared domain:** Zod-validated basic and cloze card contracts.
- **Exports:** Browser-side CSV/TXT and APKG generation.

Review collections are persisted in SQLite by FastAPI. Containerization,
observability, and responder behavior are implemented locally; public deployment
remains tracked as the external blocker in issue #22.

## Local development

Requirements: Node.js 20 or newer and npm.

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Start the FastAPI backend:

```bash
python -m pip install -e "backend[test]"
python -m uvicorn backend.app:app --reload --port 8000
```

Check [http://localhost:8000/health](http://localhost:8000/health). Its
documented response and ownership boundaries are in
[_docs/backend-architecture.md](_docs/backend-architecture.md).

The FastAPI backend resolves its Pydantic AI provider only when generation or
refinement is called. Set `AI_MODEL` (default `deepseek-v4.1-flash-free`) and the provider
credential, such as `OPENAI_API_KEY`, outside source control. Backend tests use
Pydantic AI's local `TestModel` and never require credentials or network access.
The TanStack UI calls this backend through its server-function façade.

Dependency approval for issue #26: the user explicitly authorized treating all
issues, including the required `pydantic-ai` dependency. The implementation
adds only `pydantic-ai` to the Python backend; npm dependencies remain
unchanged.

Run the validation suite and production build:

```bash
npm --prefix frontend test
npm --prefix frontend run generate-routes
npm --prefix frontend run build
npm --prefix frontend run validate-openapi
```

`npm --prefix frontend run generate-routes` discovers routes in `frontend/src/routes` and writes
`frontend/src/routeTree.gen.ts`. The OpenAPI check is deterministic and uses
the repository's Node toolchain without network access or credentials.

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

### OpenTelemetry and Grafana

The Compose stack includes an OpenTelemetry Collector, Prometheus, Loki,
Tempo, and Grafana. The server initializes OpenTelemetry before accepting
requests and sends only operation names, status, durations, and
trace/span identifiers. Prompts, source documents, card content, provider
responses, credentials, and URL values are never telemetry attributes.

Start the full application and observability stack:

```bash
docker compose up --build
```

Open Grafana at [http://localhost:3001](http://localhost:3001). The
**Flashcard Generator Overview** dashboard shows operation rate and p95
latency. Use Grafana Explore with the Prometheus, Loki, or Tempo data sources
to query the same trace-correlated request. Collector OTLP HTTP is exposed on
`localhost:4318`; Prometheus, Loki, and Tempo are available on ports 9090,
3100, and 3200 for local troubleshooting.

## Product workflow

1. Open **Input** and paste source text or provide a prompt.
2. Upload a `.pdf`, `.txt`, `.md`, or `.docx` document, or load an HTTP(S)
   article URL.
3. Generate and review basic or cloze cards.
4. Edit fields and tags, add or delete cards, and request AI refinement
   through FastAPI.
5. Export the reviewed collection as CSV, TXT, or APKG.

AI generation requires `AI_MODEL` and the matching provider credential (for
example `OPENAI_API_KEY`) in the FastAPI environment. Never commit these values
or send source content to telemetry.

## Project documentation and tracking

- [Product and architecture scope](_docs/plan.md)
- [Implementation tasks](_docs/tasks.md)
- [Evaluation criteria](_docs/evaluation_criteria.md)
- [Evaluation scorecard](_docs/evaluation-scorecard.md)
- [Backend architecture and ownership](_docs/backend-architecture.md)
- [OpenAPI contract](backend/openapi.yaml)
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
emit JSON logs with trace and span IDs and record OpenTelemetry
success/failure counters without recording prompts, documents, card content,
credentials, or API responses.
User-impact alert payloads can dispatch `.github/workflows/alert-responder.yml`;
the bounded responder records a human-actionable incident and deliberately does
not modify application data automatically.

The development environment must provide `DEVELOPMENT_DEPLOY_HOOK` and
`DEVELOPMENT_HEALTH_URL` as protected GitHub environment secrets. The workflow
waits for the configured health URL after deployment and rollback. To roll
back, manually run the Deploy development image workflow with a previously
published `sha-<commit>` image tag. Production promotion remains intentionally
environment-specific and must be configured as a protected manual environment.

No hosting target is configured in this repository yet, so the public
deployment criterion remains explicitly blocked rather than represented as a
fake URL. Configure the protected deployment hook before relying on the
development workflow.