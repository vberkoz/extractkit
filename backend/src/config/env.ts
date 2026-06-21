export const CORS_ALLOW_ORIGIN =
  process.env.EXTRACTKIT_FRONTEND_URL ?? "https://extractkit.vberkoz.com";

export const FETCH_TIMEOUT_MS = 10_000;
export const BROWSER_RENDER_TIMEOUT_MS = 20_000;
export const MAX_FETCH_BYTES = 1_000_000;
export const MAX_PDF_FETCH_BYTES = 10_000_000;

export const FETCH_USER_AGENT =
  process.env.EXTRACTKIT_FETCH_USER_AGENT
  ?? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

export const FETCH_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8";

export const FETCH_ACCEPT_LANGUAGE =
  process.env.EXTRACTKIT_FETCH_ACCEPT_LANGUAGE ?? "en-US,en;q=0.9";

export const BROWSER_RENDER_URL = process.env.EXTRACTKIT_BROWSER_RENDER_URL?.trim() ?? "";
export const BROWSER_RENDER_AUTH_TOKEN =
  process.env.EXTRACTKIT_BROWSER_RENDER_AUTH_TOKEN?.trim() ?? "";

export const BEDROCK_REGION =
  process.env.EXTRACTKIT_BEDROCK_REGION
  ?? process.env.AWS_REGION
  ?? process.env.AWS_DEFAULT_REGION
  ?? "us-east-1";

export const NOVA_MICRO_MODEL_ID =
  process.env.EXTRACTKIT_EXTRACT_MODEL_ID ?? "amazon.nova-micro-v1:0";

export function getTableName(): string {
  const tableName = process.env.EXTRACTKIT_TABLE_NAME;

  if (!tableName) {
    throw new Error("Missing EXTRACTKIT_TABLE_NAME environment variable.");
  }

  return tableName;
}
