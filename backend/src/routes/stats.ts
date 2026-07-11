import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { ok } from "../http/responses";
import { getStatsSnapshot } from "../repositories/stats-repo";

export async function handleGetStats(): Promise<APIGatewayProxyResultV2> {
  const stats = await getStatsSnapshot();
  return ok(stats);
}
