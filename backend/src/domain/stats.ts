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
};
