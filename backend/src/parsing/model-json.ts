import type { JsonValue } from "../domain/json";
import { isJsonValue } from "./common";

export function getConverseTextResponse(
  contentBlocks: Array<{ text?: string | null } | null | undefined> | undefined
): string | null {
  if (!contentBlocks) {
    return null;
  }

  const text = contentBlocks
    .map((block) => block?.text ?? "")
    .join("\n")
    .trim();

  return text === "" ? null : text;
}

export function parseJsonValueFromModelText(text: string): JsonValue | null {
  const normalized = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const candidates = [normalized];
  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(normalized.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);

      if (isJsonValue(parsed)) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
}
