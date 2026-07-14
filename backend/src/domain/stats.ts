export type EndpointMix = {
  text: number;
  url: number;
  pdf: number;
};

export type StatsResponse = {
  generatedAt: string;
  requestsToday: number;
  successRate: number;
  activeApiKeys: number;
  monthlyUsageUnits: number;
  endpointMix: EndpointMix;
  totalJobs: number;
  completedJobsToday: number;
  averageResultSizeBytes: number;
  demandSignals: {
    followUpRequests: {
      total: number;
      today: number;
      latestAt: string | null;
      topSourceFormat: string | null;
      topFrequency: string | null;
    };
    intentFunnel: {
      heroCtaClicks: number;
      sampleSelections: number;
      schemaEdits: number;
      extractionStarted: number;
      extractionSucceeded: number;
      extractionSuccessRate: number;
      topUseCase: string | null;
    };
  };
};
