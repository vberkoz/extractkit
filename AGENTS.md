# ExtractKit Agent Guide

This repo is small, but it is mid-refactor. Prefer extending the newer split-module structure instead of reintroducing large mixed-responsibility files.

## Structure

- `frontend/src/main.ts`: bootstrap only; keep it thin.
- `frontend/src/config/`: runtime values and UI defaults.
- `frontend/src/features/`: interactive workspace features; keep selectors/render/controller files feature-local.
- `frontend/src/sections/`: marketing and docs-like static sections.
- `frontend/src/lib/`: shared browser helpers, types, and API utilities.
- `backend/src/handler.ts`: Lambda entrypoint only; route logic belongs in `backend/src/routes/`.
- `backend/src/routes/`: one module per endpoint.
- `backend/src/services/`: orchestration and business workflows.
- `backend/src/repositories/`: DynamoDB persistence code only.
- `backend/src/providers/`: external service integrations such as Bedrock, Textract, and fetch.
- `backend/src/parsing/`: pure parsing and normalization helpers.
- `scripts/build/`: build entrypoints.
- `scripts/dev/`: local developer utilities.
- `scripts/test/`: live and smoke checks.
- `scripts/test/lib/`: shared live-test fixtures and helpers.
- `scripts/lib/`: shared script helpers. Prefer adding small focused scripts over making one large multipurpose script.

## Editing Preferences

- Avoid adding barrel files that duplicate a folder name, such as both `config.ts` and `config/`.
- Keep request validation close to parsing helpers, not inside route handlers.
- Keep provider modules narrow and integration-specific.
- When changing backend behavior, prefer editing a route or service first, then repositories/providers only if needed.
- When changing frontend behavior, prefer feature-local edits before touching shared helpers.

## Source Of Truth

- Production infra entrypoint is `infra/cloudformation.yaml`.
- `infra/legacy-minimal.yaml` is a legacy/minimal template; do not update it unless the task explicitly calls for legacy parity.
- Runtime frontend API configuration currently lives in `frontend/src/config/runtime.ts`.
- Longer-lived architecture choices should be recorded under `docs/adr/`.

## Validation

- Use `npm run typecheck` as the default local code check before live tests.
- Use `npm run build` for a cross-repo sanity check.
- Use `npm run check` when you want both typechecking and bundling without touching live infrastructure.
- Use the `scripts/test/` files selectively; many are live environment checks, not unit tests.
