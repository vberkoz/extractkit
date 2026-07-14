import { getById } from "../../lib/dom";

export function getStatsElements() {
  return {
    requestsTodayValue: getById<HTMLElement>("stats-requests-today"),
    successRateValue: getById<HTMLElement>("stats-success-rate"),
    activeApiKeysValue: getById<HTMLElement>("stats-active-api-keys"),
    monthlyUsageUnitsValue: getById<HTMLElement>("stats-monthly-usage-units"),
    textJobsValue: getById<HTMLElement>("stats-text-jobs"),
    urlJobsValue: getById<HTMLElement>("stats-url-jobs"),
    pdfJobsValue: getById<HTMLElement>("stats-pdf-jobs"),
    textJobsBar: getById<HTMLElement>("stats-text-jobs-bar"),
    urlJobsBar: getById<HTMLElement>("stats-url-jobs-bar"),
    pdfJobsBar: getById<HTMLElement>("stats-pdf-jobs-bar"),
    totalJobsValue: getById<HTMLElement>("stats-total-jobs"),
    completedJobsTodayValue: getById<HTMLElement>("stats-completed-jobs-today"),
    averageResultSizeValue: getById<HTMLElement>("stats-average-result-size"),
    generatedAtValue: getById<HTMLElement>("stats-generated-at"),
    demandTotalValue: getById<HTMLElement>("stats-demand-total"),
    demandTodayValue: getById<HTMLElement>("stats-demand-today"),
    demandTopSourceValue: getById<HTMLElement>("stats-demand-top-source"),
    demandTopFrequencyValue: getById<HTMLElement>("stats-demand-top-frequency"),
    demandLatestValue: getById<HTMLElement>("stats-demand-latest"),
    status: getById<HTMLElement>("stats-status")
  };
}
