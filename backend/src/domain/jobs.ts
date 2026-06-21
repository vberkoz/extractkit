import type { JsonValue } from "./json";

export type JobStatus = "completed" | "queued" | "failed";

export type GetJobResponse = {
  jobId: string;
  status: JobStatus;
  createdAt: string;
  result: JsonValue;
};
