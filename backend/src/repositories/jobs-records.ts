import type { JsonValue } from "../domain/json";
import type { JobStatus } from "../domain/jobs";
import { jobPk, userJobSk, userPk } from "./dynamo-client";
import type { CreateJobInput, JobRecord, JobResultRecord, UserJobItem } from "./jobs-repo";

export function buildJobRecord(job: CreateJobInput): JobRecord {
  return {
    PK: jobPk(job.jobId),
    SK: "METADATA",
    entityType: "JOB",
    ...job
  };
}

export function buildUserJobItem(job: CreateJobInput): UserJobItem {
  return {
    ...job,
    PK: userPk(job.userId),
    SK: userJobSk(job.createdAt, job.jobId),
    entityType: "USER_JOB",
    jobId: job.jobId,
    userId: job.userId,
    createdAt: job.createdAt,
    status: job.status
  };
}

export function buildJobResultRecord(jobId: string, result: JsonValue): JobResultRecord {
  return {
    PK: jobPk(jobId),
    SK: "RESULT",
    entityType: "JOB_RESULT",
    jobId,
    result,
    updatedAt: new Date().toISOString()
  };
}
