import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { CORS_ALLOW_ORIGIN } from "../config/env";
import type { ErrorBody, SuccessBody } from "../domain/http";
import type { FieldErrors, JsonValue } from "../domain/json";
import { HttpError } from "./errors";

const JSON_HEADERS = {
  "content-type": "application/json"
};

const CORS_HEADERS = {
  "access-control-allow-origin": CORS_ALLOW_ORIGIN,
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,x-requested-with",
  "access-control-expose-headers": "content-type",
  "access-control-max-age": "300",
  vary: "Origin"
};

export function ok(data: JsonValue): APIGatewayProxyResultV2 {
  const body: SuccessBody = {
    ok: true,
    data
  };

  return {
    statusCode: 200,
    headers: {
      ...JSON_HEADERS,
      ...CORS_HEADERS
    },
    body: JSON.stringify(body)
  };
}

export function error(
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
    headers: {
      ...JSON_HEADERS,
      ...CORS_HEADERS
    },
    body: JSON.stringify(body)
  };
}

export function noContent(): APIGatewayProxyResultV2 {
  return {
    statusCode: 204,
    headers: CORS_HEADERS
  };
}

export function handleError(cause: unknown): APIGatewayProxyResultV2 {
  if (cause instanceof HttpError) {
    return error(cause.statusCode, cause.code, cause.message, cause.fields);
  }

  console.error("Unhandled error", cause);
  return error(500, "INTERNAL_ERROR", "Internal server error.");
}
