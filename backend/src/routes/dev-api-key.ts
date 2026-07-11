import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { ok } from "../http/responses";
import { createApiKey } from "../repositories/api-keys-repo";

export async function handleCreateDevApiKey(): Promise<APIGatewayProxyResultV2> {
  const created = await createApiKey("dev");
  return ok({
    apiKey: created.rawApiKey
  });
}
