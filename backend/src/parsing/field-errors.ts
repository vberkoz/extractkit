import type { FieldErrors } from "../domain/json";
import { HttpError } from "../http/errors";

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
