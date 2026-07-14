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
    followUpTotalValue: getById<HTMLElement>("stats-follow-up-total"),
    followUpTodayValue: getById<HTMLElement>("stats-follow-up-today"),
    followUpTopSourceValue: getById<HTMLElement>("stats-follow-up-top-source"),
    followUpTopFrequencyValue: getById<HTMLElement>("stats-follow-up-top-frequency"),
    followUpLatestValue: getById<HTMLElement>("stats-follow-up-latest"),
    heroCtaClicksValue: getById<HTMLElement>("stats-hero-cta-clicks"),
    sampleSelectionsValue: getById<HTMLElement>("stats-sample-selections"),
    schemaEditsValue: getById<HTMLElement>("stats-schema-edits"),
    extractionStartedValue: getById<HTMLElement>("stats-extraction-started"),
    extractionSucceededValue: getById<HTMLElement>("stats-extraction-succeeded"),
    extractionSuccessRateValue: getById<HTMLElement>("stats-extraction-success-rate"),
    topUseCaseValue: getById<HTMLElement>("stats-top-use-case"),
    status: getById<HTMLElement>("stats-status")
  };
}
