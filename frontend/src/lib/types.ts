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
};
