# ADR 0001: Use Bedrock Nova Micro For Structured Extraction

## Status

Accepted

## Context

ExtractKit needs a single backend extraction path that can turn free-form text into structured JSON matching a requested schema shape. The current backend is intentionally small and runs inside one Lambda entrypoint, so the model integration needs to stay simple to operate and easy to swap later.

The current implementation in `backend/src/providers/bedrock/extract.ts` uses Amazon Bedrock with `amazon.nova-micro-v1:0`, a deterministic prompt shape, `temperature: 0`, and a strict “return JSON only” instruction set.

## Decision

Use Amazon Bedrock with Amazon Nova Micro as the default structured extraction model, configured through `EXTRACTKIT_EXTRACT_MODEL_ID` and defaulting to `amazon.nova-micro-v1:0`.

Keep the model interaction behind the provider layer so prompt construction and response parsing remain isolated from routes and services.

## Consequences

- The backend keeps one clear model integration path instead of branching by provider inside services.
- Local reasoning about extraction behavior stays concentrated in `backend/src/providers/bedrock/`.
- Future model changes should update the provider and config surfaces first, not route logic.
- The system currently optimizes for predictable JSON output and operational simplicity over model plurality.
