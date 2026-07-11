import { createHash } from "node:crypto";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { HttpError } from "../http/errors";

export function readBearerToken(event: APIGatewayProxyEventV2): string {
  const authorization = event.headers.authorization ?? event.headers.Authorization;

  if (!authorization) {
    throw new HttpError(401, "UNAUTHORIZED", "Missing Authorization header.");
  }

  const [scheme, token] = authorization.split(" ", 2);

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "UNAUTHORIZED", "Authorization header must use Bearer auth.");
  }

  return token;
}

export function hashApiKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
