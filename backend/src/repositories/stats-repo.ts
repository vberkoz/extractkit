import { scanAllItems } from "./dynamo-scan";
import { buildStatsSnapshot, type StatsItem } from "./stats-aggregation";

export async function getStatsSnapshot() {
  const items = await scanAllItems<StatsItem>(
    "#entityType, #jobId, #createdAt, #disabled, #amount, #yyyyMM, #result, #sk, #sourceFormat, #frequency",
    {
      "#amount": "amount",
      "#createdAt": "createdAt",
      "#disabled": "disabled",
      "#entityType": "entityType",
      "#jobId": "jobId",
      "#frequency": "frequency",
      "#result": "result",
      "#sourceFormat": "sourceFormat",
      "#sk": "SK",
      "#yyyyMM": "yyyyMM"
    }
  );
  const generatedAt = new Date().toISOString();
  return buildStatsSnapshot(items, generatedAt);
}
