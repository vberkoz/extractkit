import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ok } from "../http/responses";

export async function handleHealth(
  _event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  return ok({
    service: "extractkit",
    status: "ok",
    timestamp: new Date().toISOString()
  });
}
