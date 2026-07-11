export function buildExtractionSystemPrompt(): string {
  return [
    "You extract structured data from user-provided content.",
    "Return only valid JSON matching the provided schema shape as closely as possible.",
    "Use null when a value is missing or not supported by the content.",
    "Do not include markdown fences or explanatory text."
  ].join(" ");
}
