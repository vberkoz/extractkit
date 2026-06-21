# Testing

This repo does not currently have a local unit-test suite. Most test scripts are live checks against deployed infrastructure.

## Sanity Check

- `npm run typecheck`
  Verifies the frontend and backend TypeScript code without bundling or hitting live infrastructure.
- `npm run build`
  Verifies that frontend and backend bundles still compile.
- `npm run check`
  Runs both local typechecking and bundle builds without touching deployed services.

## Live Checks

- `npm run test:live-smoke`
  End-to-end health, usage, PDF extract, and job lookup smoke test.
- `npm run test:frontend-live`
  Frontend HTML plus core API path smoke test.
- `npm run test:live-extract`
  Text extraction smoke test.
- `npm run test:custom-domains`
  Frontend + custom-domain API smoke test.
- `npm run test:get-job`
  Create job then fetch job result.
- `npm run test:extract-pdf`
  PDF extraction smoke test.
- `npm run test:usage`
  Usage endpoint shape check.

## Environment Notes

- Several scripts read `EXTRACTKIT_API_KEY`.
- Stack output resolution lives in `scripts/lib/runtime-config.mjs`.
- Shared live-test fixtures and response helpers live in `scripts/test/lib/`.
- Some scripts fall back to production-like defaults, so review a script before running it against a sensitive environment.
