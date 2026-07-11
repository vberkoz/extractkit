import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { AuthContext } from "../domain/auth";
import { HttpError } from "../http/errors";
import { getApiKey } from "../repositories/api-keys-repo";
import { hashApiKey, readBearerToken } from "../parsing/auth";

export async function authenticateRequest(
  event: APIGatewayProxyEventV2
): Promise<AuthContext> {
  const token = readBearerToken(event);
  const apiKeyHash = hashApiKey(token);
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
