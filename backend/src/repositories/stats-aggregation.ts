import type { StatsResponse } from "../domain/stats";
import type { DynamoRecord } from "./dynamo-client";
import { getJobKind } from "../parsing/job-kind";

export type StatsItem = DynamoRecord & {
  entityType?: string;
  SK?: string;
  jobId?: string;
  createdAt?: string;
  eventType?: string;
  useCaseId?: string;
  useCaseLabel?: string;
  sourceFormat?: string;
  frequency?: string;
  sampleKind?: string;
  schemaEdited?: boolean;
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
  let followUpRequests = 0;
  let followUpToday = 0;
  let latestFollowUpAt: string | null = null;
  let heroCtaClicks = 0;
  let sampleSelections = 0;
  let schemaEdits = 0;
  let extractionStarted = 0;
  let extractionSucceeded = 0;
  const sourceFormatCounts = new Map<string, number>();
  const frequencyCounts = new Map<string, number>();
  const useCaseCounts = new Map<string, number>();

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
        followUpRequests += 1;

        if (typeof item.createdAt === "string" && item.createdAt.slice(0, 10) === today) {
          followUpToday += 1;
        }

        if (typeof item.createdAt === "string") {
          const createdAt = item.createdAt;

          if (latestFollowUpAt === null || createdAt > latestFollowUpAt) {
            latestFollowUpAt = createdAt;
          }
        }

        trackCount(sourceFormatCounts, item.sourceFormat);
        trackCount(frequencyCounts, item.frequency);
      } else if (item.entityType === "EVENT" && item.SK === "METADATA") {
        switch (item.eventType) {
          case "hero_cta_click":
            heroCtaClicks += 1;
            break;
          case "sample_selected":
            sampleSelections += 1;
            break;
          case "schema_edited":
            schemaEdits += 1;
            break;
          case "extraction_started":
            extractionStarted += 1;
            trackCount(useCaseCounts, item.useCaseLabel ?? item.useCaseId);
            break;
          case "extraction_succeeded":
            extractionSucceeded += 1;
            break;
        }
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
      followUpRequests: {
        total: followUpRequests,
        today: followUpToday,
        latestAt: latestFollowUpAt,
        topSourceFormat: getTopCountLabel(sourceFormatCounts),
        topFrequency: getTopCountLabel(frequencyCounts)
      },
      intentFunnel: {
        heroCtaClicks,
        sampleSelections,
        schemaEdits,
        extractionStarted,
        extractionSucceeded,
        extractionSuccessRate: extractionStarted === 0 ? 0 : Math.round((extractionSucceeded / extractionStarted) * 100),
        topUseCase: getTopCountLabel(useCaseCounts)
      }
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
