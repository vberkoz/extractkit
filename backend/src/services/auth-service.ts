import { createHash } from "node:crypto";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { AuthContext } from "../domain/auth";
import { HttpError } from "../http/errors";
import { getApiKey } from "../repositories/api-keys-repo";

export async function authenticateRequest(
  event: APIGatewayProxyEventV2
): Promise<AuthContext> {
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
