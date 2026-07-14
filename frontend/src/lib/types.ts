export type TabId =
  | "text-extract"
  | "url-extract"
  | "pdf-extract";

export type AppRoute = "home" | "stats";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: {
    message: string;
    code: string;
    fields?: Record<string, string[]>;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type UsageData = {
  used: number;
  limit: number;
  plan: string;
  month: string;
};

export type StatsData = {
  generatedAt: string;
  requestsToday: number;
  successRate: number;
  activeApiKeys: number;
  monthlyUsageUnits: number;
  endpointMix: {
    text: number;
    url: number;
    pdf: number;
  };
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

export type DemandCaptureData = {
  leadId: string;
  capturedAt: string;
};

export type DemandCaptureResponse = ApiResponse<DemandCaptureData>;

export type IntentEventData = {
  eventId: string;
  capturedAt: string;
};

export type IntentEventResponse = ApiResponse<IntentEventData>;
