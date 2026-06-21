import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  ExtractPdfRequest,
  ExtractRequest,
  ExtractUrlRequest
} from "../domain/extraction";
import type { JsonValue } from "../domain/json";
import { HttpError } from "../http/errors";
import {
  addFieldError,
  hasFieldErrors,
  isRecord,
  withOptionalFieldErrors
} from "./common";

export function parseJsonBody(event: APIGatewayProxyEventV2): Record<string, JsonValue> {
  if (!event.body) {
    throw new HttpError(400, "INVALID_REQUEST", "Request body is required.");
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  if (!isRecord(parsed)) {
    throw new HttpError(400, "INVALID_REQUEST", "Request body must be a JSON object.");
  }

  return parsed;
}

export function getRequiredString(body: Record<string, JsonValue>, key: string): string {
  const value = body[key];

  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(
      400,
      "INVALID_REQUEST",
      `Request body field '${key}' must be a non-empty string.`
    );
  }

  return value;
}

export function parseExtractRequest(body: Record<string, JsonValue>): ExtractRequest {
  const debugEnabled = getDebugMode(body);
  const contentValue = body.content;

  if (typeof contentValue !== "string" || contentValue.trim() === "") {
    throw withOptionalFieldErrors(
      400,
      "INVALID_REQUEST",
      "Request body is invalid.",
      debugEnabled,
      {
        content: ["Content must be a non-empty string."]
      }
    );
  }

  return {
    content: contentValue,
    ...parseExtractConfig(body, debugEnabled)
  };
}

export function parseExtractUrlRequest(body: Record<string, JsonValue>): ExtractUrlRequest {
  const debugEnabled = getDebugMode(body);
  const url = getRequiredString(body, "url");

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw withOptionalFieldErrors(
      400,
      "INVALID_REQUEST",
      "Request body is invalid.",
      debugEnabled,
      {
        url: ["URL must be a valid absolute URL."]
      }
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw withOptionalFieldErrors(
      400,
      "INVALID_REQUEST",
      "Request body is invalid.",
      debugEnabled,
      {
        url: ["URL protocol must be http or https."]
      }
    );
  }

  return {
    url: parsedUrl.toString(),
    extractRequest: {
      content: "",
      ...parseExtractConfig(body, debugEnabled)
    }
  };
}

export function parseExtractPdfRequest(body: Record<string, JsonValue>): ExtractPdfRequest {
  const debugEnabled = getDebugMode(body);
  const pdfUrl = getRequiredString(body, "pdfUrl");

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(pdfUrl);
  } catch {
    throw withOptionalFieldErrors(
      400,
      "INVALID_REQUEST",
      "Request body is invalid.",
      debugEnabled,
      {
        pdfUrl: ["pdfUrl must be a valid absolute URL."]
      }
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw withOptionalFieldErrors(
      400,
      "INVALID_REQUEST",
      "Request body is invalid.",
      debugEnabled,
      {
        pdfUrl: ["pdfUrl protocol must be http or https."]
      }
    );
  }

  const extractConfig = parseExtractConfig(body, debugEnabled);

  if (extractConfig.options?.mode !== undefined) {
    throw withOptionalFieldErrors(
      400,
      "INVALID_REQUEST",
      "Request options are invalid.",
      debugEnabled,
      {
        "options.mode": ["Mode is not supported for PDF extraction jobs."]
      }
    );
  }

  return {
    pdfUrl: parsedUrl.toString(),
    schema: extractConfig.schema,
    options:
      extractConfig.options?.debug !== undefined
        ? { debug: extractConfig.options.debug }
        : undefined
  };
}

function parseExtractConfig(
  body: Record<string, JsonValue>,
  debugEnabled: boolean
): Omit<ExtractRequest, "content"> {
  const schemaValue = body.schema;

  if (!isRecord(schemaValue) || Object.keys(schemaValue).length === 0) {
    throw withOptionalFieldErrors(
      400,
      "INVALID_REQUEST",
      "Request body field 'schema' must be a non-empty object.",
      debugEnabled,
      {
        schema: ["Schema must be a non-empty object."]
      }
    );
  }

  const optionsValue = body.options;

  if (optionsValue !== undefined && !isRecord(optionsValue)) {
    throw withOptionalFieldErrors(
      400,
      "INVALID_REQUEST",
      "Request body field 'options' must be an object.",
      debugEnabled,
      {
        options: ["Options must be an object."]
      }
    );
  }

  const modeValue = optionsValue?.mode;
  const mode = modeValue === "sync" ? modeValue : undefined;
  const debugOption =
    typeof optionsValue?.debug === "boolean" ? optionsValue.debug : undefined;
  const optionsErrors: Record<string, string[]> = {};

  if (modeValue !== undefined && mode === undefined) {
    addFieldError(optionsErrors, "options.mode", "Mode must be 'sync'.");
  }

  if (optionsValue?.debug !== undefined && debugOption === undefined) {
    addFieldError(optionsErrors, "options.debug", "Debug must be a boolean.");
  }

  if (hasFieldErrors(optionsErrors)) {
    throw withOptionalFieldErrors(
      400,
      "INVALID_REQUEST",
      "Request options are invalid.",
      debugEnabled,
      optionsErrors
    );
  }

  return {
    schema: schemaValue,
    options:
      mode !== undefined || debugOption !== undefined
        ? {
            ...(mode !== undefined ? { mode } : {}),
            ...(debugOption !== undefined ? { debug: debugOption } : {})
          }
        : undefined
  };
}

function getDebugMode(body: Record<string, JsonValue>): boolean {
  if (!isRecord(body.options)) {
    return false;
  }

  return body.options.debug === true;
}
