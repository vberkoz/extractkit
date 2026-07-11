import { HttpError } from "../http/errors";
import { normalizePath } from "./path";

export function getJobIdFromPath(path: string): string {
  const normalized = normalizePath(path);
  const prefix = "/v1/jobs/";
  const jobId = normalized.slice(prefix.length);

  if (!jobId) {
    throw new HttpError(400, "INVALID_JOB_ID", "Job ID is required.");
  }

  return jobId;
}
