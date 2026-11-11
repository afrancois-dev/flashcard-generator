# Backend architecture and ownership

The application has two backend runtimes with intentionally separate
responsibilities:

- **Frontend:** The root `frontend/` directory contains the TanStack
  Start/React application and its generated route tree. Root configuration,
  Docker, CI, and documentation stay outside this directory.
- **TanStack server functions** are a thin browser-facing backend-for-frontend.
  They validate UI inputs and forward requests to FastAPI.
- **FastAPI** owns generation, refinement, collection persistence, URL
  extraction, and all versioned backend contracts. It uses the clearly named
  `flashcard_generation_agent` from Pydantic AI.

## Health contract

`GET http://localhost:8000/health` returns HTTP `200` with:

```json
{
  "status": "ok",
  "service": "flashcard-generator-fastapi",
  "correlation_id": "request-123"
}
```

The `X-Correlation-ID` request header is accepted when it contains 1–128
ASCII letters, digits, `.`, `_`, `:`, or `-`. A valid value is echoed in both
the JSON response and response header. If it is absent or invalid, the service
generates a UUID-based value and returns it in both places. The endpoint does
not call external services, use credentials, read customer data, or access a
database. Unexpected application failures use FastAPI's standard HTTP 500
behavior and must not be interpreted as a healthy response.

## Flashcard generation contract

`POST /api/v1/flashcards/generate` accepts source text, unique `basic` and/or
`cloze` card types, and a requested count from 1–50. Source text is bounded
to 100,000 characters. Responses contain validated basic (`front`/`back`) or
cloze (`text` with `{{c1::...}}`) cards and the correlation ID. Validation,
provider, and invalid-output failures use the stable
`{error, message, correlation_id}` envelope.

The provider is resolved lazily from `AI_MODEL` (default
`openai:gpt-4o-mini`) and its provider credentials, such as `OPENAI_API_KEY`.
Tests use Pydantic AI's local `TestModel`; no live provider call is needed.
Prompts, source text, credentials, and provider responses are never logged.

## Local startup

Install the Python runtime and test dependencies from the repository root:

```bash
python -m pip install -e "backend[test]"
python -m uvicorn backend.app:app --reload --port 8000
```

Port `8000` is used so the service does not conflict with the TanStack
development server on port `3000`.

The repository-owned OpenAPI contract is `backend/openapi.yaml`. It documents
health, generation, refinement, persistence, and URL extraction.
