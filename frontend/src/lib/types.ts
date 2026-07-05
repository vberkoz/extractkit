export type TabId =
  | "text-extract"
  | "url-extract"
  | "pdf-extract"
  | "usage"
  | "docs";

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
