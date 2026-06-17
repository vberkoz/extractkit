import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Handler
} from "aws-lambda";
import { createHash, randomUUID } from "node:crypto";
import {
  createJob,
  getApiKey,
  getJob,
  getJobResult,
  incrementUsage,
  saveJobResult
} from "./dynamodb";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

type SuccessBody = {
  ok: true;
  data: JsonValue;
};

type ErrorBody = {
  ok: false;
  error: {
    message: string;
    code: string;
  };
};

type AuthContext = {
  userId: string;
  apiKeyId: string;
  plan: string;
};

type ExtractSchemaType = "string" | "number";

type ExtractRequest = {
  content: string;
  schema: Record<string, ExtractSchemaType>;
  options?: {
    mode?: string;
  };
};

type ExtractResponse = {
  jobId: string;
  data: Record<string, string | number | null>;
  confidence: number;
  usage: {
    units: number;
  };
};

class HttpError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

const JSON_HEADERS = {
  "content-type": "application/json"
};

export const handler: Handler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
> = async (event) => {
  try {
    const method = event.requestContext.http.method.toUpperCase();
    const path = normalizePath(event.rawPath);
    const auth = isPublicRoute(method, path) ? null : await authenticateRequest(event);

    if (method === "GET" && path === "/v1/health") {
      return ok({
        service: "extractkit",
        status: "ok",
        timestamp: new Date().toISOString()
      });
    }

    if (method === "POST" && path === "/v1/extract") {
      return await handleExtract(event, auth!);
    }

    if (method === "POST" && path === "/v1/extract-url") {
      return await handleExtractUrl(event, auth!);
    }

    if (method === "POST" && path === "/v1/extract-pdf") {
      return await handleExtractPdf(event, auth!);
    }

    if (method === "GET" && path.startsWith("/v1/jobs/")) {
      return await handleGetJob(event, auth!);
    }

    if (method === "GET" && path === "/v1/usage") {
      return ok({
        period: "current",
        requests: 0,
        jobs: 0
      });
    }

    throw new HttpError(404, "NOT_FOUND", `Route not found: ${method} ${path}`);
  } catch (error) {
    return handleError(error);
  }
};

async function handleExtract(
  event: APIGatewayProxyEventV2,
  auth: AuthContext
): Promise<APIGatewayProxyResultV2> {
  const body = parseJsonBody(event);
  const request = parseExtractRequest(body);
  const jobId = createJobId("extract");
  const createdAt = new Date().toISOString();
  const data = extractData(request.content, request.schema);
  const response: ExtractResponse = {
    jobId,
    data,
    confidence: 0.5,
    usage: {
      units: 1
    }
  };

  await createJob({
    jobId,
    userId: auth.userId,
    createdAt,
    apiKeyId: auth.apiKeyId,
    status: "completed",
    request: body
  });
  await saveJobResult(jobId, response);
  await incrementUsage(auth.userId, getCurrentUsagePeriod(), response.usage.units);

  return ok(response);
}

async function handleExtractUrl(
  event: APIGatewayProxyEventV2,
  auth: AuthContext
): Promise<APIGatewayProxyResultV2> {
  void auth;
  const body = parseJsonBody(event);
  const url = getRequiredString(body, "url");

  return ok({
    mode: "url",
    url,
    jobId: createJobId("url")
  });
}

async function handleExtractPdf(
  event: APIGatewayProxyEventV2,
  auth: AuthContext
): Promise<APIGatewayProxyResultV2> {
  void auth;
  const body = parseJsonBody(event);

  if (!hasNonEmptyString(body, "contentBase64") && !hasNonEmptyString(body, "url")) {
    throw new HttpError(
      400,
      "INVALID_REQUEST",
      "Request body must include either 'contentBase64' or 'url'."
    );
  }

  return ok({
    mode: "pdf",
    source: hasNonEmptyString(body, "url") ? "url" : "contentBase64",
    jobId: createJobId("pdf")
  });
}

async function handleGetJob(
  event: APIGatewayProxyEventV2,
  auth: AuthContext
): Promise<APIGatewayProxyResultV2> {
  const path = normalizePath(event.rawPath);
  const prefix = "/v1/jobs/";
  const jobId = path.slice(prefix.length);

  if (!jobId) {
    throw new HttpError(400, "INVALID_JOB_ID", "Job ID is required.");
  }

  const job = await getJob(jobId);

  if (!job || job.userId !== auth.userId) {
    throw new HttpError(404, "NOT_FOUND", "Job not found.");
  }

  const jobResult = await getJobResult(jobId);

  return ok({
    jobId,
    status: "completed",
    createdAt: job.createdAt,
    result: jobResult?.result ?? null
  });
}

async function authenticateRequest(event: APIGatewayProxyEventV2): Promise<AuthContext> {
  const authorization = event.headers.authorization ?? event.headers.Authorization;

  if (!authorization) {
    throw new HttpError(401, "UNAUTHORIZED", "Missing Authorization header.");
  }

  const [scheme, token] = authorization.split(" ", 2);

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "UNAUTHORIZED", "Authorization header must use Bearer auth.");
  }

  const apiKeyHash = createHash("sha256").update(token).digest("hex");
  const apiKey = await getApiKey(apiKeyHash);

  if (!apiKey || apiKey.disabled) {
    throw new HttpError(401, "UNAUTHORIZED", "Invalid API key.");
  }

  return {
    userId: apiKey.userId,
    apiKeyId: apiKey.apiKeyId,
    plan: apiKey.plan
  };
}

function ok(data: JsonValue): APIGatewayProxyResultV2 {
  const body: SuccessBody = {
    ok: true,
    data
  };

  return {
    statusCode: 200,
    headers: JSON_HEADERS,
    body: JSON.stringify(body)
  };
}

function error(statusCode: number, code: string, message: string): APIGatewayProxyResultV2 {
  const body: ErrorBody = {
    ok: false,
    error: {
      message,
      code
    }
  };

  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body)
  };
}

function handleError(cause: unknown): APIGatewayProxyResultV2 {
  if (cause instanceof HttpError) {
    return error(cause.statusCode, cause.code, cause.message);
  }

  console.error("Unhandled error", cause);
  return error(500, "INTERNAL_ERROR", "Internal server error.");
}

function isPublicRoute(method: string, path: string): boolean {
  return method === "GET" && path === "/v1/health";
}

function parseJsonBody(event: APIGatewayProxyEventV2): Record<string, JsonValue> {
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

function getRequiredString(body: Record<string, JsonValue>, key: string): string {
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

function parseExtractRequest(body: Record<string, JsonValue>): ExtractRequest {
  const content = getRequiredString(body, "content");
  const schemaValue = body.schema;

  if (!isRecord(schemaValue) || Object.keys(schemaValue).length === 0) {
    throw new HttpError(
      400,
      "INVALID_REQUEST",
      "Request body field 'schema' must be a non-empty object."
    );
  }

  const schema: Record<string, ExtractSchemaType> = {};

  for (const [key, value] of Object.entries(schemaValue)) {
    if (value !== "string" && value !== "number") {
      throw new HttpError(
        400,
        "INVALID_REQUEST",
        `Schema field '${key}' must be 'string' or 'number'.`
      );
    }

    schema[key] = value;
  }

  const optionsValue = body.options;

  if (optionsValue !== undefined && !isRecord(optionsValue)) {
    throw new HttpError(400, "INVALID_REQUEST", "Request body field 'options' must be an object.");
  }

  const mode = optionsValue?.mode;

  if (mode !== undefined && mode !== "sync") {
    throw new HttpError(
      400,
      "INVALID_REQUEST",
      "Request body field 'options.mode' must be 'sync'."
    );
  }

  return {
    content,
    schema,
    options: mode !== undefined ? { mode } : undefined
  };
}

function hasNonEmptyString(body: Record<string, JsonValue>, key: string): boolean {
  const value = body[key];
  return typeof value === "string" && value.trim() !== "";
}

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
}

function createJobId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

function extractData(
  content: string,
  schema: Record<string, ExtractSchemaType>
): Record<string, string | number | null> {
  const lines = content.split(/\r?\n/);
  const email = findEmail(content);
  const firstNumber = findFirstNumber(content);
  const keyedValues = buildKeyValueMap(lines);
  const result: Record<string, string | number | null> = {};

  for (const [schemaKey, schemaType] of Object.entries(schema)) {
    const directMatch = keyedValues.get(normalizeLookupKey(schemaKey));

    if (schemaType === "number") {
      result[schemaKey] = parseNumberValue(directMatch) ?? firstNumber;
      continue;
    }

    if (looksLikeEmailField(schemaKey)) {
      result[schemaKey] = directMatch ?? email;
      continue;
    }

    result[schemaKey] = directMatch ?? null;
  }

  return result;
}

function buildKeyValueMap(lines: string[]): Map<string, string> {
  const values = new Map<string, string>();

  for (const line of lines) {
    const match = line.match(/^\s*([^:\n]+?)\s*:\s*(.+?)\s*$/);

    if (!match) {
      continue;
    }

    const [, rawKey, rawValue] = match;
    const value = rawValue.trim();

    if (!value) {
      continue;
    }

    values.set(normalizeLookupKey(rawKey), value);
  }

  return values;
}

function normalizeLookupKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase();
}

function looksLikeEmailField(key: string): boolean {
  return normalizeLookupKey(key).includes("email");
}

function findEmail(content: string): string | null {
  const match = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? null;
}

function parseNumberValue(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  return findFirstNumber(value);
}

function findFirstNumber(content: string): number | null {
  const match = content.match(/(?:^|[^\w])(?:\$|usd\s*)?(-?\d+(?:[.,]\d+)?)(?!\w)/i);

  if (!match) {
    return null;
  }

  const normalized = match[1].replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getCurrentUsagePeriod(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
