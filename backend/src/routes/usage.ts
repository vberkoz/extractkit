import type { APIGatewayProxyResultV2 } from "aws-lambda";
import type { AuthContext } from "../domain/auth";
import type { UsageResponse } from "../domain/usage";
import { ok } from "../http/responses";
import { getUsage } from "../repositories/usage-repo";
import { getCurrentUsagePeriod, getPlanUsageLimit } from "../services/usage-service";

export async function handleGetUsage(auth: AuthContext): Promise<APIGatewayProxyResultV2> {
  const month = getCurrentUsagePeriod();
  const usage = await getUsage(auth.userId, month);
  const response: UsageResponse = {
    month,
    used: Number(usage?.amount ?? 0),
    limit: getPlanUsageLimit(auth.plan),
    plan: auth.plan
  };

  return ok(response);
}
