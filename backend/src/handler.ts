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
    fields?: Record<string, string[]>;
  };
};

type AuthContext = {
  userId: string;
  apiKeyId: string;
  plan: string;
};

type ExtractSchemaType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "email"
  | "url"
  | "array:string"
  | "array:number";

type FieldErrors = Record<string, string[]>;

type ExtractedValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | null;

type RawExtractedField = {
  present: boolean;
  value: string | null;
};

type ExtractRequest = {
  content: string;
  schema: Record<string, ExtractSchemaType>;
  options?: {
    mode?: string;
    debug?: boolean;
  };
};

type ExtractUrlRequest = {
  url: string;
  extractRequest: ExtractRequest;
};

type HtmlExtractionHints = {
  title: string | null;
  metaDescription: string | null;
  sourceUrl: string;
};

type ExtractResponse = {
  jobId: string;
  data: Record<string, ExtractedValue>;
  confidence: number;
  usage: {
    units: number;
  };
};

class HttpError extends Error {
  statusCode: number;
  code: string;
  fields?: FieldErrors;

  constructor(statusCode: number, code: string, message: string, fields?: FieldErrors) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}

const JSON_HEADERS = {
  "content-type": "application/json"
};

const FETCH_TIMEOUT_MS = 10_000;
const MAX_FETCH_BYTES = 1_000_000;
const FETCH_USER_AGENT = "ExtractKit/0.1 (+https://example.com)";

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
  return executeExtraction({
    auth,
    jobPrefix: "extract",
    request,
    requestBody: body
  });
}

async function handleExtractUrl(
  event: APIGatewayProxyEventV2,
  auth: AuthContext
): Promise<APIGatewayProxyResultV2> {
  const body = parseJsonBody(event);
  const request = parseExtractUrlRequest(body);
  const html = await fetchUrlHtml(request.url);
  const content = htmlToReadableText(html);
  const hints = extractHtmlHints(html, request.url);

  if (content === "") {
    throw new HttpError(422, "EMPTY_CONTENT", "Fetched URL did not contain readable text.");
  }

  return executeExtraction({
    auth,
    jobPrefix: "url",
    request: {
      ...request.extractRequest,
      content
    },
    requestBody: body,
    htmlHints: hints
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

function error(
  statusCode: number,
  code: string,
  message: string,
  fields?: FieldErrors
): APIGatewayProxyResultV2 {
  const body: ErrorBody = {
    ok: false,
    error: {
      message,
      code,
      ...(fields ? { fields } : {})
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
    return error(cause.statusCode, cause.code, cause.message, cause.fields);
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

function parseExtractUrlRequest(body: Record<string, JsonValue>): ExtractUrlRequest {
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

  const schema: Record<string, ExtractSchemaType> = {};
  const schemaErrors: FieldErrors = {};

  for (const [key, value] of Object.entries(schemaValue)) {
    if (key.trim() === "") {
      addFieldError(schemaErrors, key, "Schema field name must not be empty.");
      continue;
    }

    if (!isSupportedSchemaType(value)) {
      addFieldError(
        schemaErrors,
        key,
        "Unsupported schema type. Expected one of: string, number, boolean, date, email, url, array:string, array:number."
      );
      continue;
    }

    schema[key] = value;
  }

  if (hasFieldErrors(schemaErrors)) {
    throw withOptionalFieldErrors(
      400,
      "INVALID_SCHEMA",
      "Schema contains unsupported field types.",
      debugEnabled,
      schemaErrors
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

  const mode = optionsValue?.mode;
  const optionsErrors: FieldErrors = {};

  if (mode !== undefined && mode !== "sync") {
    addFieldError(optionsErrors, "options.mode", "Mode must be 'sync'.");
  }

  if (
    optionsValue?.debug !== undefined &&
    typeof optionsValue.debug !== "boolean"
  ) {
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
    schema,
    options:
      mode !== undefined || optionsValue?.debug !== undefined
        ? {
            ...(mode !== undefined ? { mode } : {}),
            ...(optionsValue?.debug !== undefined ? { debug: optionsValue.debug } : {})
          }
        : undefined
  };
}

function hasNonEmptyString(body: Record<string, JsonValue>, key: string): boolean {
  const value = body[key];
  return typeof value === "string" && value.trim() !== "";
}

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSupportedSchemaType(value: JsonValue): value is ExtractSchemaType {
  return (
    value === "string" ||
    value === "number" ||
    value === "boolean" ||
    value === "date" ||
    value === "email" ||
    value === "url" ||
    value === "array:string" ||
    value === "array:number"
  );
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

async function executeExtraction(input: {
  auth: AuthContext;
  jobPrefix: string;
  request: ExtractRequest;
  requestBody: Record<string, JsonValue>;
  htmlHints?: HtmlExtractionHints;
}): Promise<APIGatewayProxyResultV2> {
  const jobId = createJobId(input.jobPrefix);
  const createdAt = new Date().toISOString();
  const rawData = input.htmlHints
    ? extractDataWithHtmlHints(input.request.content, input.request.schema, input.htmlHints)
    : extractData(input.request.content, input.request.schema);
  const { data, fields } = coerceAndValidateExtractedData(rawData, input.request.schema);

  if (hasFieldErrors(fields)) {
    throw new HttpError(
      422,
      "EXTRACTION_VALIDATION_FAILED",
      "Extracted data did not match the requested schema.",
      input.request.options?.debug ? fields : undefined
    );
  }

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
    userId: input.auth.userId,
    createdAt,
    apiKeyId: input.auth.apiKeyId,
    status: "completed",
    request: input.requestBody
  });
  await saveJobResult(jobId, response);
  await incrementUsage(input.auth.userId, getCurrentUsagePeriod(), response.usage.units);

  return ok(response);
}

async function fetchUrlHtml(url: string): Promise<string> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": FETCH_USER_AGENT
      },
      redirect: "follow",
      signal: abortController.signal
    });

    if (!response.ok) {
      throw new HttpError(
        502,
        "UPSTREAM_FETCH_FAILED",
        `Failed to fetch URL content. Upstream responded with ${response.status}.`
      );
    }

    const html = await readResponseTextWithLimit(response, MAX_FETCH_BYTES);

    if (html.trim() === "") {
      throw new HttpError(422, "EMPTY_CONTENT", "Fetched URL did not contain readable HTML.");
    }

    return html;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (isAbortError(error)) {
      throw new HttpError(504, "FETCH_TIMEOUT", "Fetching the URL timed out.");
    }

    throw new HttpError(502, "UPSTREAM_FETCH_FAILED", "Failed to fetch URL content.");
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseTextWithLimit(response: Response, maxBytes: number): Promise<string> {
  const contentLengthHeader = response.headers.get("content-length");
  const declaredLength = contentLengthHeader ? Number(contentLengthHeader) : Number.NaN;

  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpError(
      413,
      "FETCH_RESPONSE_TOO_LARGE",
      `Fetched URL content exceeded the ${maxBytes} byte limit.`
    );
  }

  if (!response.body) {
    const text = await response.text();

    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw new HttpError(
        413,
        "FETCH_RESPONSE_TOO_LARGE",
        `Fetched URL content exceeded the ${maxBytes} byte limit.`
      );
    }

    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      throw new HttpError(
        413,
        "FETCH_RESPONSE_TOO_LARGE",
        `Fetched URL content exceeded the ${maxBytes} byte limit.`
      );
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

function htmlToReadableText(html: string): string {
  const withoutIgnoredTags = stripHtmlTags(html, ["script", "style", "nav", "footer", "svg"]);
  const withBlockBreaks = withoutIgnoredTags
    .replace(/<(?:br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|main|aside|header|li|ul|ol|h[1-6]|table|tr)>/gi, "\n");
  const withoutTags = withBlockBreaks.replace(/<[^>]+>/g, " ");
  const decoded = decodeBasicHtmlEntities(withoutTags);

  return decoded
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractHtmlHints(html: string, sourceUrl: string): HtmlExtractionHints {
  return {
    title: extractTagText(html, "title"),
    metaDescription: extractMetaContent(html, "description"),
    sourceUrl
  };
}

function stripHtmlTags(html: string, tagNames: string[]): string {
  let result = html;

  for (const tagName of tagNames) {
    const pairPattern = new RegExp(
      `<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`,
      "gi"
    );
    const selfClosingPattern = new RegExp(`<${tagName}\\b[^>]*\\/?>`, "gi");

    result = result.replace(pairPattern, " ");
    result = result.replace(selfClosingPattern, " ");
  }

  return result;
}

function decodeBasicHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function extractDataWithHtmlHints(
  content: string,
  schema: Record<string, ExtractSchemaType>,
  hints: HtmlExtractionHints
): Record<string, RawExtractedField> {
  const rawData = extractData(content, schema);

  for (const [field, type] of Object.entries(schema)) {
    if (rawData[field]?.present) {
      continue;
    }

    const hintedValue = findHtmlHintValue(field, type, hints);

    if (hintedValue === null) {
      continue;
    }

    rawData[field] = {
      present: true,
      value: hintedValue
    };
  }

  return rawData;
}

function findHtmlHintValue(
  field: string,
  type: ExtractSchemaType,
  hints: HtmlExtractionHints
): string | null {
  const normalizedField = normalizeLookupKey(field);

  if (type === "url" && looksLikeWebsiteField(normalizedField)) {
    return hints.sourceUrl;
  }

  if (type === "string" && looksLikeTitleField(normalizedField) && hints.title) {
    return hints.title;
  }

  if (type === "string" && looksLikeDescriptionField(normalizedField) && hints.metaDescription) {
    return hints.metaDescription;
  }

  return null;
}

function extractTagText(html: string, tagName: string): string | null {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = html.match(pattern);

  if (!match) {
    return null;
  }

  const text = decodeBasicHtmlEntities(match[1].replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

  return text === "" ? null : text;
}

function extractMetaContent(html: string, metaName: string): string | null {
  const metaTagPattern = /<meta\b[^>]*>/gi;
  const metaTags = html.match(metaTagPattern) ?? [];

  for (const tag of metaTags) {
    const nameValue = readHtmlAttribute(tag, "name") ?? readHtmlAttribute(tag, "property");

    if (!nameValue || nameValue.trim().toLowerCase() !== metaName.toLowerCase()) {
      continue;
    }

    const contentValue = readHtmlAttribute(tag, "content");

    if (!contentValue) {
      continue;
    }

    const normalized = decodeBasicHtmlEntities(contentValue).replace(/\s+/g, " ").trim();

    if (normalized !== "") {
      return normalized;
    }
  }

  return null;
}

function readHtmlAttribute(tag: string, attributeName: string): string | null {
  const pattern = new RegExp(
    `${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + "`" + `]+))`,
    "i"
  );
  const match = tag.match(pattern);

  if (!match) {
    return null;
  }

  return match[1] ?? match[2] ?? match[3] ?? null;
}

function extractData(
  content: string,
  schema: Record<string, ExtractSchemaType>
): Record<string, RawExtractedField> {
  const lines = content.split(/\r?\n/);
  const keyedValues = buildKeyValueMap(lines);
  const result: Record<string, RawExtractedField> = {};

  for (const schemaKey of Object.keys(schema)) {
    const directMatch = keyedValues.get(normalizeLookupKey(schemaKey));

    if (directMatch !== undefined) {
      result[schemaKey] = {
        present: true,
        value: directMatch
      };
      continue;
    }

    const fallbackValue = findFallbackValue(content, schemaKey, schema[schemaKey]);
    result[schemaKey] = {
      present: fallbackValue !== null,
      value: fallbackValue
    };
  }

  return result;
}

function findFallbackValue(
  content: string,
  schemaKey: string,
  schemaType: ExtractSchemaType
): string | null {
  if (schemaType === "email" || looksLikeEmailField(schemaKey)) {
    return findEmail(content);
  }

  if (schemaType === "number" || schemaType === "array:number") {
    const firstNumber = findFirstNumberMatch(content);
    return firstNumber?.raw ?? null;
  }

  if (schemaType === "url") {
    return findUrl(content);
  }

  if (schemaType === "boolean") {
    return findBooleanToken(content);
  }

  if (schemaType === "date") {
    return findDateLikeValue(content);
  }

  return null;
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

function looksLikeTitleField(key: string): boolean {
  return key === "title" || key.endsWith("title") || key.includes("headline");
}

function looksLikeWebsiteField(key: string): boolean {
  return key.includes("website") || key === "url" || key.endsWith("url") || key.includes("link");
}

function looksLikeDescriptionField(key: string): boolean {
  return key.includes("description") || key.includes("summary") || key.includes("excerpt");
}

function findEmail(content: string): string | null {
  const match = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? null;
}

function findFirstNumber(content: string): number | null {
  const match = findFirstNumberMatch(content);

  if (!match) {
    return null;
  }

  const parsed = parseLooseNumber(match.raw);
  return parsed;
}

function findFirstNumberMatch(content: string): { raw: string } | null {
  const match = content.match(
    /(?:^|[^\w])((?:\$|usd\s*)?-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)(?!\w)/i
  );

  if (!match) {
    return null;
  }

  return { raw: match[1] };
}

function findUrl(content: string): string | null {
  const match = content.match(/https?:\/\/[^\s]+/i);
  return match?.[0] ?? null;
}

function findBooleanToken(content: string): string | null {
  const match = content.match(/\b(?:yes|no|true|false)\b/i);
  return match?.[0] ?? null;
}

function findDateLikeValue(content: string): string | null {
  const patterns = [
    /\b\d{4}-\d{2}-\d{2}\b/,
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
    /\b\d{1,2}-\d{1,2}-\d{4}\b/,
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},\s+\d{4}\b/i
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);

    if (match) {
      return match[0];
    }
  }

  return null;
}

function coerceAndValidateExtractedData(
  rawData: Record<string, RawExtractedField>,
  schema: Record<string, ExtractSchemaType>
): {
  data: Record<string, ExtractedValue>;
  fields: FieldErrors;
} {
  const data: Record<string, ExtractedValue> = {};
  const fields: FieldErrors = {};

  for (const [field, type] of Object.entries(schema)) {
    const rawField = rawData[field] ?? { present: false, value: null };
    const coerced = coerceValueBySchemaType(rawField.value, type);
    data[field] = coerced;

    if (
      rawField.present
      && coerced === null
      && rawField.value !== null
      && type !== "string"
    ) {
      addFieldError(fields, field, getTypeValidationMessage(type));
      continue;
    }

    if (!isValueValidForSchemaType(coerced, type)) {
      addFieldError(fields, field, getTypeValidationMessage(type));
    }
  }

  return { data, fields };
}

function coerceValueBySchemaType(
  value: string | null,
  type: ExtractSchemaType
): ExtractedValue {
  if (value === null) {
    return null;
  }

  if (type === "string" || type === "email" || type === "url") {
    return value.trim();
  }

  if (type === "number") {
    return parseLooseNumber(value);
  }

  if (type === "boolean") {
    return parseLooseBoolean(value);
  }

  if (type === "date") {
    return parseLooseDate(value);
  }

  if (type === "array:string") {
    return parseStringArray(value);
  }

  return parseNumberArray(value);
}

function isValueValidForSchemaType(value: ExtractedValue, type: ExtractSchemaType): boolean {
  if (value === null) {
    return true;
  }

  if (type === "string") {
    return typeof value === "string";
  }

  if (type === "number") {
    return typeof value === "number" && Number.isFinite(value);
  }

  if (type === "boolean") {
    return typeof value === "boolean";
  }

  if (type === "date") {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  if (type === "email") {
    return (
      typeof value === "string" &&
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
    );
  }

  if (type === "url") {
    if (typeof value !== "string") {
      return false;
    }

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  if (type === "array:string") {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
  }

  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

function getTypeValidationMessage(type: ExtractSchemaType): string {
  if (type === "array:string") {
    return "Expected an array of strings.";
  }

  if (type === "array:number") {
    return "Expected an array of numbers.";
  }

  return `Expected a ${type}.`;
}

function parseLooseNumber(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/^\$/, "")
    .replace(/^usd\s*/i, "")
    .replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLooseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();

  if (normalized === "true" || normalized === "yes") {
    return true;
  }

  if (normalized === "false" || normalized === "no") {
    return false;
  }

  return null;
}

function parseLooseDate(value: string): string | null {
  const normalized = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return [
    parsed.getUTCFullYear(),
    String(parsed.getUTCMonth() + 1).padStart(2, "0"),
    String(parsed.getUTCDate()).padStart(2, "0")
  ].join("-");
}

function parseStringArray(value: string): string[] | null {
  const tokens = splitArrayLikeString(value);
  return tokens.length > 0 ? tokens : null;
}

function parseNumberArray(value: string): number[] | null {
  const tokens = splitArrayLikeString(value);

  if (tokens.length === 0) {
    return null;
  }

  const numbers: number[] = [];

  for (const token of tokens) {
    const parsed = parseLooseNumber(token);

    if (parsed === null) {
      return null;
    }

    numbers.push(parsed);
  }

  return numbers;
}

function splitArrayLikeString(value: string): string[] {
  const trimmed = value.trim();

  if (trimmed === "") {
    return [];
  }

  const withoutBrackets =
    trimmed.startsWith("[") && trimmed.endsWith("]")
      ? trimmed.slice(1, -1)
      : trimmed;

  return withoutBrackets
    .split(/[,\n;|]/)
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function addFieldError(fields: FieldErrors, field: string, message: string): void {
  const existing = fields[field] ?? [];
  existing.push(message);
  fields[field] = existing;
}

function hasFieldErrors(fields: FieldErrors): boolean {
  return Object.keys(fields).length > 0;
}

function withOptionalFieldErrors(
  statusCode: number,
  code: string,
  message: string,
  debugEnabled: boolean,
  fields: FieldErrors
): HttpError {
  return new HttpError(statusCode, code, message, debugEnabled ? fields : undefined);
}

function getDebugMode(body: Record<string, JsonValue>): boolean {
  if (!isRecord(body.options)) {
    return false;
  }

  return body.options.debug === true;
}

function getCurrentUsagePeriod(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
