import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Handler
} from "aws-lambda";
import { createHash } from "node:crypto";
import { getApiKey } from "./dynamodb";

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
  void auth;
  const body = parseJsonBody(event);

  return ok({
    mode: "text",
    received: body,
    jobId: createJobId("extract")
  });
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
  void auth;
  const path = normalizePath(event.rawPath);
  const prefix = "/v1/jobs/";
  const jobId = path.slice(prefix.length);

  if (!jobId) {
    throw new HttpError(400, "INVALID_JOB_ID", "Job ID is required.");
  }

  return ok({
    jobId,
    status: "completed"
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
  return `${prefix}_${Date.now()}`;
}
