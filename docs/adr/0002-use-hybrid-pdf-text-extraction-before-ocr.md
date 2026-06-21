# ADR 0002: Use Hybrid PDF Text Extraction Before OCR

## Status

Accepted

## Context

PDF inputs vary widely. Some contain good embedded text, some are scanned images, and some are mixed. Running OCR on every page is slower and more expensive than necessary, while relying only on native PDF text misses scanned or weak pages.

The current implementation in `backend/src/providers/pdf/extract-text.ts` first tries native extraction with `pdf-parse`, evaluates page quality, and only OCRs weak pages with Textract when partial fallback is needed.

## Decision

Use a hybrid PDF extraction strategy:

1. Try native PDF text extraction first.
2. Return native text directly when page quality is good.
3. Use Textract for the whole document when native extraction is empty or uniformly weak.
4. For mixed documents, OCR only weak pages and merge the preferred page text into one result.

## Consequences

- Good digital PDFs stay fast and cheaper than full OCR.
- Scanned or degraded PDFs still have a recovery path.
- PDF behavior is more complex than a single extraction method, but that complexity is isolated to the PDF provider.
- Changes to PDF quality heuristics should happen in `backend/src/parsing/pdf-text.ts` and `backend/src/providers/pdf/extract-text.ts`.
