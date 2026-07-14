import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { FieldErrors, JsonValue } from "../domain/json";
import { HttpError } from "../http/errors";
import { addFieldError, hasFieldErrors } from "./field-errors";
import { parseJsonBody } from "./body";

export type InterestCaptureInput = {
  need: string;
  sourceFormat: string;
  frequency: string;
  contactEmail?: string;
  entryPoint: string;
};

const MAX_TEXT_LENGTH = 500;
const MAX_ENTRY_POINT_LENGTH = 64;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseInterestCaptureRequest(
  event: APIGatewayProxyEventV2
): InterestCaptureInput {
  const body = parseJsonBody(event);
  const fields: FieldErrors = {};

  const need = readRequiredText(body.need, "need", fields, 3, MAX_TEXT_LENGTH);
  const sourceFormat = readRequiredText(body.sourceFormat, "sourceFormat", fields, 2, 64);
  const frequency = readRequiredText(body.frequency, "frequency", fields, 2, 64);
  const entryPoint = readOptionalText(body.entryPoint, "entryPoint", fields, 1, MAX_ENTRY_POINT_LENGTH) ?? "hero";
  const contactEmail = readOptionalEmail(body.contactEmail, "contactEmail", fields);

  if (hasFieldErrors(fields)) {
    throw new HttpError(
      400,
      "INVALID_REQUEST",
      "Please complete the extraction interest form.",
      fields
    );
  }

  return {
    need,
    sourceFormat,
    frequency,
    ...(contactEmail ? { contactEmail } : {}),
    entryPoint
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

function readOptionalEmail(
  value: JsonValue,
  field: string,
  fields: FieldErrors
): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const email = readTextValue(value, field, fields, 3, 254);

  if (email && !EMAIL_PATTERN.test(email)) {
    addFieldError(fields, field, "Must be a valid email address.");
  }

  return email;
}
