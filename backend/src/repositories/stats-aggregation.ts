import type { StatsResponse } from "../domain/stats";
import type { DynamoRecord } from "./dynamo-client";
import { getJobKind } from "../parsing/job-kind";

export type StatsItem = DynamoRecord & {
  entityType?: string;
  SK?: string;
  jobId?: string;
  createdAt?: string;
  sourceFormat?: string;
  frequency?: string;
  disabled?: boolean;
  amount?: number;
  yyyyMM?: string;
  result?: unknown;
};

export function buildStatsSnapshot(
  items: StatsItem[],
  generatedAt: string
): StatsResponse {
  const today = generatedAt.slice(0, 10);
  const currentMonth = generatedAt.slice(0, 7);

  let totalJobs = 0;
  let requestsToday = 0;
  let completedJobsToday = 0;
  let activeApiKeys = 0;
  let monthlyUsageUnits = 0;
  let totalResultSizeBytes = 0;
  let resultCount = 0;
  let textJobs = 0;
  let urlJobs = 0;
  let pdfJobs = 0;
  let demandTotal = 0;
  let demandToday = 0;
  let latestDemandAt: string | null = null;
  const sourceFormatCounts = new Map<string, number>();
  const frequencyCounts = new Map<string, number>();

  for (const item of items) {
    if (item.entityType === "API_KEY" && item.disabled !== true) {
      activeApiKeys += 1;
      continue;
    }

    if (item.entityType === "USAGE" && item.yyyyMM === currentMonth) {
      monthlyUsageUnits += Number(item.amount ?? 0);
      continue;
    }

    if (item.entityType !== "JOB" || item.SK !== "METADATA") {
      if (item.entityType === "JOB_RESULT" && item.result !== undefined) {
        totalResultSizeBytes += Buffer.byteLength(JSON.stringify(item.result), "utf8");
        resultCount += 1;
      } else if (item.entityType === "LEAD" && item.SK === "METADATA") {
        demandTotal += 1;

        if (typeof item.createdAt === "string" && item.createdAt.slice(0, 10) === today) {
          demandToday += 1;
        }

        if (typeof item.createdAt === "string") {
          const createdAt = item.createdAt;

          if (latestDemandAt === null || createdAt > latestDemandAt) {
            latestDemandAt = createdAt;
          }
        }

        trackCount(sourceFormatCounts, item.sourceFormat);
        trackCount(frequencyCounts, item.frequency);
      }

      continue;
    }

    totalJobs += 1;

    if (typeof item.createdAt === "string" && item.createdAt.slice(0, 10) === today) {
      requestsToday += 1;
      completedJobsToday += 1;
    }

    switch (getJobKind(item.jobId)) {
      case "text":
        textJobs += 1;
        break;
      case "url":
        urlJobs += 1;
        break;
      case "pdf":
        pdfJobs += 1;
        break;
    }
  }

  return {
    generatedAt,
    requestsToday,
    successRate: totalJobs === 0 ? 0 : 100,
    activeApiKeys,
    monthlyUsageUnits,
    endpointMix: {
      text: textJobs,
      url: urlJobs,
      pdf: pdfJobs
    },
    totalJobs,
    completedJobsToday,
    averageResultSizeBytes: resultCount === 0 ? 0 : Math.round(totalResultSizeBytes / resultCount),
    demandSignals: {
      total: demandTotal,
      today: demandToday,
      latestAt: latestDemandAt,
      topSourceFormat: getTopCountLabel(sourceFormatCounts),
      topFrequency: getTopCountLabel(frequencyCounts)
    }
  };
}

function trackCount(counts: Map<string, number>, value: string | undefined): void {
  if (!value) {
    return;
  }

  counts.set(value, (counts.get(value) ?? 0) + 1);
}

function getTopCountLabel(counts: Map<string, number>): string | null {
  let topLabel: string | null = null;
  let topCount = 0;

  for (const [label, count] of counts.entries()) {
    if (count > topCount) {
      topLabel = label;
      topCount = count;
    }
  }

  return topLabel;
}
