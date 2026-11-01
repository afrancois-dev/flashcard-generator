# Evaluation Scorecard

This scorecard records evidence for `_docs/evaluation_criteria.md`. It is
updated as evaluation follow-up issues are completed.

| Criterion | Current status | Evidence |
|---|---|---|
| Problem description | Complete | `README.MD` describes the problem, workflow, and expected behavior. |
| Product specification | Complete | `_docs/plan.md`, `_docs/tasks.md`, and the public GitHub issue tracker. |
| Agent team specification | Complete | `_docs/process.md` and `_docs/team/`. |
| Context management | Complete | `AGENTS.MD` links to modular project documentation. |
| Application | Complete locally | SQLite persistence is connected to the review route; see #20 and `frontend/src/server/card-repository.ts`. |
| Testing | Complete locally | 27 unit/integration-style tests pass with `npm test`; persistence restart coverage is in #20. |
| Containerization | Complete locally | Dockerfile, Compose volume, health check, and smoke-tested image are in #21. |
| Deployment | Blocked | #22 contains versioned GHCR publishing, a deployment hook, and rollback workflow, but no hosting target or deployment secret is configured. |
| CI/CD | Implemented, not exercised remotely | PR validation and main-branch publish/deploy workflows are in `.github/workflows/`; remote execution requires repository environment configuration. |
| Observability | Complete locally | Correlated JSON logs, in-memory metrics, and the `/observability` route are implemented in #23. |
| Alerting on user impact | Complete locally | Failure-rate alert evaluation and deterministic responder demonstration are implemented in #23. |
| On-call agent | Complete as bounded responder | `alert-responder.yml` and `ops/respond-to-alert.mjs` create trace-correlated human-actionable incidents. |

## Verification commands

```bash
npm --prefix frontend install
npm --prefix frontend test
npm --prefix frontend run generate-routes
npm --prefix frontend run build
```

The scorecard should be updated with links to deployment, dashboards, alert
demonstrations, and responder evidence when those follow-up issues are
complete.

## Current limitation

The final public deployment criterion remains blocked until a hosting target and
protected deployment hook are configured for issue #22. No secret or customer
data is stored in this repository.
