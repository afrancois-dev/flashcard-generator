# Backend architecture and ownership

The application has two backend runtimes with intentionally separate
responsibilities:

- **Frontend:** The root `frontend/` directory contains the TanStack
  Start/React application and its generated route tree. Root configuration,
  Docker, CI, and documentation stay outside this directory.
- **TanStack server functions** remain the browser-facing backend-for-frontend.
  They own request coordination, persistence, AI orchestration, validation,
  document extraction, refinement, and all existing flashcard behavior.
- **FastAPI** owns the root `backend/` service boundary. In this slice it owns
  only the operational `GET /health` contract, including its stable service ID
  and correlation-ID propagation. It does not duplicate product logic or
  access the database, AI provider, or document extractors.

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

## Local startup

Install the Python runtime and test dependencies from the repository root:

```bash
python -m pip install -e "backend[test]"
python -m uvicorn backend.app:app --reload --port 8000
```

Port `8000` is used so the service does not conflict with the TanStack
development server on port `3000`.

The repository-owned OpenAPI contract is `backend/openapi.yaml`. It intentionally
contains only this operational `/health` path; product endpoints remain
owned by TanStack server functions until a separate contract is approved.
