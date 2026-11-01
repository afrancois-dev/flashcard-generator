# Repository Instructions

## Project direction

- Read `_docs/plan.md` before making architectural decisions.
- Treat `_docs/backlog.md` as the ordered implementation backlog; its issue
  numbers correspond to GitHub issues in this repository.
- Keep changes focused on the active task and preserve existing behavior
  unless the task explicitly requires a change.

## Workflow

- Follow `_docs/process.md` for the task lifecycle and contributor roles.
- Work on one backlog issue at a time.
- Read the issue acceptance criteria before implementation and verification.
- Read `_docs/evaluation_criteria.md` before implementation and verification to
  understand the repository-wide quality bar.
- Do not close an issue until its acceptance criteria have been verified.

## Dependencies and implementation

- Ask for approval before adding or changing a dependency.
- Prefer existing project patterns and shared utilities over duplicated logic.
- Surface errors explicitly; do not silently ignore failures or return
  success-shaped fallbacks.

## Testing and UI

- Read `_docs/testing-guidelines.md` before writing or changing tests.
- Run the smallest relevant test suite after each implementation change.
- Read `_docs/design-system.md` before making UI changes.
- Preserve accessibility, responsive behavior, and established visual patterns.

## Commits

- Read `_docs/commit-template.md` before creating a commit.
- Keep commits small and focused on one coherent change.