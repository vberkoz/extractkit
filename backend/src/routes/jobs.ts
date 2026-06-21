import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import type { AuthContext } from "../domain/auth";
import type { GetJobResponse } from "../domain/jobs";
import { HttpError } from "../http/errors";
import { ok } from "../http/responses";
import { normalizeJobStatus, normalizePath } from "../parsing/common";
import { getJob, getJobResult } from "../repositories/jobs-repo";

export async function handleGetJob(
  event: APIGatewayProxyEventV2,
  auth: AuthContext
): Promise<APIGatewayProxyResultV2> {
  const path = normalizePath(event.rawPath);
  const prefix = "/v1/jobs/";
  const jobId = path.slice(prefix.length);

  if (!jobId) {
    throw new HttpError(400, "INVALID_JOB_ID", "Job ID is required.");
  }

  const job = await getJob(jobId);

  if (!job || job.userId !== auth.userId) {
    throw new HttpError(404, "NOT_FOUND", "Job not found.");
  }

  const jobResult = await getJobResult(jobId);
  const response: GetJobResponse = {
    jobId,
    status: normalizeJobStatus(job.status, jobResult !== null),
    createdAt: job.createdAt,
    result: jobResult?.result ?? null
  };

  return ok(response);
}
