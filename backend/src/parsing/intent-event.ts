import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { FieldErrors, JsonValue } from "../domain/json";
import { HttpError } from "../http/errors";
import { addFieldError, hasFieldErrors } from "./field-errors";
import { parseJsonBody } from "./body";

export type IntentEventType =
  | "hero_cta_click"
  | "sample_selected"
  | "schema_edited"
  | "extraction_started"
  | "extraction_succeeded";

export type IntentSurface = "hero" | "workspace" | "demand-capture";

export type IntentEventInput = {
  visitorId: string;
  eventType: IntentEventType;
  surface: IntentSurface;
  sampleKind?: "text" | "url" | "pdf";
  useCaseId?: string;
  useCaseLabel?: string;
  schemaEdited?: boolean;
};

const MAX_VISITOR_ID_LENGTH = 128;
const MAX_USE_CASE_ID_LENGTH = 64;
const MAX_USE_CASE_LABEL_LENGTH = 120;

export function parseIntentEventRequest(event: APIGatewayProxyEventV2): IntentEventInput {
  const body = parseJsonBody(event);
  const fields: FieldErrors = {};

  const visitorId = readRequiredText(body.visitorId, "visitorId", fields, 8, MAX_VISITOR_ID_LENGTH);
  const eventType = readEnum(
    body.eventType,
    "eventType",
    fields,
    ["hero_cta_click", "sample_selected", "schema_edited", "extraction_started", "extraction_succeeded"] as const
  );
  const surface = readEnum(body.surface, "surface", fields, ["hero", "workspace", "demand-capture"] as const);
  const sampleKind = readOptionalEnum(body.sampleKind, "sampleKind", fields, ["text", "url", "pdf"] as const);
  const useCaseId = readOptionalText(body.useCaseId, "useCaseId", fields, 1, MAX_USE_CASE_ID_LENGTH);
  const useCaseLabel = readOptionalText(
    body.useCaseLabel,
    "useCaseLabel",
    fields,
    1,
    MAX_USE_CASE_LABEL_LENGTH
  );
  const schemaEdited = readOptionalBoolean(body.schemaEdited, "schemaEdited", fields);

  if (hasFieldErrors(fields)) {
    throw new HttpError(400, "INVALID_REQUEST", "Please provide a valid intent event.", fields);
  }

  return {
    visitorId,
    eventType,
    surface,
    ...(sampleKind ? { sampleKind } : {}),
    ...(useCaseId ? { useCaseId } : {}),
    ...(useCaseLabel ? { useCaseLabel } : {}),
    ...(schemaEdited === undefined ? {} : { schemaEdited })
  };
}

function readRequiredText(
  value: JsonValue,
  field: string,
  fields: FieldErrors,
  minLength: number,
  maxLength: number
): string {
  const text = readTextValue(value, field, fields, minLength, maxLength);
  return text;
}

function readOptionalText(
  value: JsonValue,
  field: string,
  fields: FieldErrors,
  minLength: number,
  maxLength: number
): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return readTextValue(value, field, fields, minLength, maxLength);
}

function readTextValue(
  value: JsonValue,
  field: string,
  fields: FieldErrors,
  minLength: number,
  maxLength: number
): string {
  if (typeof value !== "string") {
    addFieldError(fields, field, "Must be a string.");
    return "";
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    addFieldError(fields, field, `Must be at most ${maxLength} characters long.`);
  }

  if (trimmed.length < minLength) {
    addFieldError(fields, field, `Must be at least ${minLength} characters long.`);
  }

  return trimmed;
}

function readEnum<T extends string>(
  value: JsonValue,
  field: string,
  fields: FieldErrors,
  allowed: readonly T[]
): T {
  if (typeof value !== "string") {
    addFieldError(fields, field, "Must be a string.");
    return allowed[0];
  }

  if (!allowed.includes(value as T)) {
    addFieldError(fields, field, `Must be one of: ${allowed.join(", ")}.`);
    return allowed[0];
  }

  return value as T;
}

function readOptionalEnum<T extends string>(
  value: JsonValue,
  field: string,
  fields: FieldErrors,
  allowed: readonly T[]
): T | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return readEnum(value, field, fields, allowed);
}

function readOptionalBoolean(
  value: JsonValue,
  field: string,
  fields: FieldErrors
): boolean | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "boolean") {
    addFieldError(fields, field, "Must be a boolean.");
    return undefined;
  }

  return value;
}
