import type { ExtractRequest, HtmlExtractionHints } from "../../domain/extraction";

export function buildModelExtractionPrompt(
  request: ExtractRequest,
  htmlHints?: HtmlExtractionHints
): string {
  const schemaDescription = JSON.stringify(request.schema, null, 2);
  const hintsDescription = htmlHints
    ? JSON.stringify(
        {
          title: htmlHints.title,
          metaDescription: htmlHints.metaDescription,
          sourceUrl: htmlHints.sourceUrl
        },
        null,
        2
      )
    : "null";

  return [
    "Schema:",
    schemaDescription,
    "",
    "Optional page hints:",
    hintsDescription,
    "",
    "Content:",
    request.content
  ].join("\n");
}
