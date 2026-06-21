# ADR 0003: Use Browser-Render Fallback For Blocked URL Fetches

## Status

Accepted

## Context

Some target pages can be fetched directly with browser-like headers, but others block or degrade direct server-side requests. For `POST /v1/extract-url`, failing immediately on every blocked fetch would reduce usefulness, while always using a browser-render service would add operational cost and complexity.

The current implementation in `backend/src/providers/fetch/` uses direct fetch first and only tries the optional browser-render service for selected blocked-status responses such as `401`, `403`, `406`, and `429`.

## Decision

Keep direct fetch as the default path for URL extraction, and use the configured browser-render service only as an optional fallback when direct fetch is blocked in known ways.

Expose the fallback through environment variables:

- `EXTRACTKIT_BROWSER_RENDER_URL`
- `EXTRACTKIT_BROWSER_RENDER_AUTH_TOKEN`

## Consequences

- Normal pages stay on the cheaper and simpler direct-fetch path.
- The system can still recover from common anti-bot or access-control blocking scenarios.
- The browser-render integration remains optional rather than becoming a hard dependency.
- URL extraction changes should preserve the distinction between direct fetch behavior and fallback behavior unless the product decision changes deliberately.
