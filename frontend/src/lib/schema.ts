export function parseSchema(rawValue: string):
  | { ok: true; value: Record<string, string> }
  | { ok: false; message: string } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return {
      ok: false,
      message: "Schema must be valid JSON."
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      message: "Schema must be a JSON object."
    };
  }

  return {
    ok: true,
    value: parsed as Record<string, string>
  };
}
