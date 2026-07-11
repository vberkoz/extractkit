import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { JsonValue } from "../domain/json";
import { HttpError } from "../http/errors";
import { isRecord } from "./common";

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
