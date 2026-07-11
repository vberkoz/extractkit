import type { JobStatus } from "../domain/jobs";

export function normalizeJobStatus(status: string | undefined, hasResult: boolean): JobStatus {
  if (status === "completed" || status === "queued" || status === "failed") {
    return status;
  }

  return hasResult ? "completed" : "queued";
}
