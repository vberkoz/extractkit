# Architecture

## Request Flow

1. The static frontend in `frontend/` renders the marketing shell and interactive demo workspace.
2. Browser requests go to API Gateway-backed backend routes exposed by the Lambda handler.
3. `backend/src/handler.ts` normalizes the request, resolves a route, authenticates if needed, and delegates.
4. Route modules in `backend/src/routes/` parse request data and call service-layer orchestration.
5. Services coordinate repositories and providers:
   - `repositories/` for DynamoDB persistence
   - `providers/` for Bedrock, Textract, PDF parsing, and fetch integrations
   - `parsing/` for pure request/content/model parsing helpers

## Source Of Truth

- Backend entrypoint: `backend/src/handler.ts`
- Route surface: `backend/src/routes/`
- Frontend bootstrap: `frontend/src/main.ts`
- Infra entrypoint: `infra/cloudformation.yaml`
- Legacy infra template: `infra/legacy-minimal.yaml`
- Script entrypoints: `scripts/build/`, `scripts/dev/`, `scripts/test/`
- Architecture decisions: `docs/adr/`

## Change Guidance

- For API behavior changes, start in `backend/src/routes/` or `backend/src/services/`.
- For storage changes, limit edits to `backend/src/repositories/` when possible.
- For third-party integration behavior, prefer `backend/src/providers/`.
- For frontend UI behavior, change a feature module before touching shared browser helpers.
