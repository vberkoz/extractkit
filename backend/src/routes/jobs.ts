import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import type { AuthContext } from "../domain/auth";
import type { GetJobResponse } from "../domain/jobs";
import { HttpError } from "../http/errors";
import { ok } from "../http/responses";
import { getJobIdFromPath } from "../parsing/job-path";
import { normalizeJobStatus } from "../parsing/job-status";
import { getJob, getJobResult } from "../repositories/jobs-repo";

export async function handleGetJob(
  event: APIGatewayProxyEventV2,
  auth: AuthContext
): Promise<APIGatewayProxyResultV2> {
  const jobId = getJobIdFromPath(event.rawPath);

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
