import { API_BASE_URL } from "../../config/runtime";
import { getErrorMessage, setStatus } from "../../lib/dom";
import type { ApiResponse, StatsData } from "../../lib/types";
import { getStatsElements } from "./selectors";

export function initStatsFeature(): void {
  const elements = getStatsElements();

  setStatus(elements.status, "Loading live stats...", "pending");
  void loadStats();

  async function loadStats(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/stats`);
      const payload = (await response.json()) as ApiResponse<StatsData>;

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.ok
            ? `Request failed with status ${response.status}.`
            : payload.error.message
        );
      }

      updateMetrics(payload.data);
      setStatus(
        elements.status,
        `Live stats loaded from DynamoDB at ${formatTimestamp(payload.data.generatedAt)}.`,
        "success"
      );
    } catch (error) {
      setStatus(elements.status, getErrorMessage(error), "error");
    }
  }

  function updateMetrics(data: StatsData): void {
    elements.requestsTodayValue.textContent = formatNumber(data.requestsToday);
    elements.successRateValue.textContent = `${Math.round(data.successRate)}%`;
    elements.activeApiKeysValue.textContent = formatNumber(data.activeApiKeys);
    elements.monthlyUsageUnitsValue.textContent = formatNumber(data.monthlyUsageUnits);

    const totalMix = data.endpointMix.text + data.endpointMix.url + data.endpointMix.pdf;
    const textShare = getShare(data.endpointMix.text, totalMix);
    const urlShare = getShare(data.endpointMix.url, totalMix);
    const pdfShare = getShare(data.endpointMix.pdf, totalMix);

    elements.textJobsValue.textContent = `${formatNumber(data.endpointMix.text)} (${textShare}%)`;
    elements.urlJobsValue.textContent = `${formatNumber(data.endpointMix.url)} (${urlShare}%)`;
    elements.pdfJobsValue.textContent = `${formatNumber(data.endpointMix.pdf)} (${pdfShare}%)`;

    elements.textJobsBar.style.width = `${textShare}%`;
    elements.urlJobsBar.style.width = `${urlShare}%`;
    elements.pdfJobsBar.style.width = `${pdfShare}%`;

    elements.totalJobsValue.textContent = formatNumber(data.totalJobs);
    elements.completedJobsTodayValue.textContent = formatNumber(data.completedJobsToday);
    elements.averageResultSizeValue.textContent = formatBytes(data.averageResultSizeBytes);
    elements.generatedAtValue.textContent = formatTimestamp(data.generatedAt);
    elements.followUpTotalValue.textContent = formatNumber(data.demandSignals.followUpRequests.total);
    elements.followUpTodayValue.textContent = formatNumber(data.demandSignals.followUpRequests.today);
    elements.followUpTopSourceValue.textContent = formatLabel(data.demandSignals.followUpRequests.topSourceFormat);
    elements.followUpTopFrequencyValue.textContent = formatLabel(data.demandSignals.followUpRequests.topFrequency);
    elements.followUpLatestValue.textContent = formatOptionalTimestamp(data.demandSignals.followUpRequests.latestAt);
    elements.heroCtaClicksValue.textContent = formatNumber(data.demandSignals.intentFunnel.heroCtaClicks);
    elements.sampleSelectionsValue.textContent = formatNumber(data.demandSignals.intentFunnel.sampleSelections);
    elements.schemaEditsValue.textContent = formatNumber(data.demandSignals.intentFunnel.schemaEdits);
    elements.extractionStartedValue.textContent = formatNumber(data.demandSignals.intentFunnel.extractionStarted);
    elements.extractionSucceededValue.textContent = formatNumber(data.demandSignals.intentFunnel.extractionSucceeded);
    elements.extractionSuccessRateValue.textContent = `${Math.round(data.demandSignals.intentFunnel.extractionSuccessRate)}%`;
    elements.topUseCaseValue.textContent = formatLabel(data.demandSignals.intentFunnel.topUseCase);
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${formatNumber(value)} B`;
  }

  const kilobytes = value / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));
}

function formatOptionalTimestamp(value: string | null): string {
  return value ? formatTimestamp(value) : "-";
}

function getShare(value: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function formatLabel(value: string | null): string {
  if (!value) {
    return "-";
  }

  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
