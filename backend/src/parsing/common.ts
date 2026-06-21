import { randomUUID } from "node:crypto";
import type { FieldErrors, JsonValue } from "../domain/json";
import type { JobStatus } from "../domain/jobs";
import { HttpError } from "../http/errors";

export function isRecord(value: unknown): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item));
  }

  if (typeof value === "object") {
    return Object.values(value).every((item) => isJsonValue(item));
  }

  return false;
}

export function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
}

export function createJobId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function normalizeJobStatus(status: string | undefined, hasResult: boolean): JobStatus {
  if (status === "completed" || status === "queued" || status === "failed") {
    return status;
  }

  return hasResult ? "completed" : "queued";
}

export function addFieldError(fields: FieldErrors, field: string, message: string): void {
  const existing = fields[field] ?? [];
  existing.push(message);
  fields[field] = existing;
}

export function hasFieldErrors(fields: FieldErrors): boolean {
  return Object.keys(fields).length > 0;
}

export function withOptionalFieldErrors(
  statusCode: number,
  code: string,
  message: string,
  debugEnabled: boolean,
  fields: FieldErrors
): HttpError {
  return new HttpError(statusCode, code, message, debugEnabled ? fields : undefined);
}
