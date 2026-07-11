import {
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand
} from "@aws-sdk/lib-dynamodb";
import { getTableName } from "../config/env";
import type { JsonValue } from "../domain/json";
import type { JobStatus } from "../domain/jobs";
import {
  dynamo,
  DynamoRecord,
  jobPk,
  userPk
} from "./dynamo-client";
import {
  buildJobRecord,
  buildJobResultRecord,
  buildUserJobItem
} from "./jobs-records";

export type JobRecord = DynamoRecord & {
  PK: string;
  SK: "METADATA";
  jobId: string;
  userId: string;
  createdAt: string;
  status?: JobStatus;
};

export type JobResultRecord = DynamoRecord & {
  PK: string;
  SK: "RESULT";
  jobId: string;
  result: JsonValue;
  updatedAt: string;
};

export type UserJobItem = DynamoRecord & {
  PK: string;
  SK: string;
  entityType: "USER_JOB";
  jobId: string;
  userId: string;
  createdAt: string;
  status?: JobStatus;
};

export type CreateJobInput = DynamoRecord & {
  jobId: string;
  userId: string;
  createdAt: string;
  status?: JobStatus;
};

export async function createJob(job: CreateJobInput): Promise<void> {
  const jobItem: JobRecord = buildJobRecord(job);
  const userJobItem: UserJobItem = buildUserJobItem(job);

  await dynamo.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: getTableName(),
            Item: jobItem,
            ConditionExpression: "attribute_not_exists(PK)"
          }
        },
        {
          Put: {
            TableName: getTableName(),
            Item: userJobItem,
            ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
          }
        }
      ]
    })
  );
}

export async function getJob(jobId: string): Promise<JobRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: getTableName(),
      Key: {
        PK: jobPk(jobId),
        SK: "METADATA"
      }
    })
  );

  return (result.Item as JobRecord | undefined) ?? null;
}

export async function getJobResult(jobId: string): Promise<JobResultRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: getTableName(),
      Key: {
        PK: jobPk(jobId),
        SK: "RESULT"
      }
    })
  );

  return (result.Item as JobResultRecord | undefined) ?? null;
}

export async function saveJobResult(
  jobId: string,
  result: JsonValue
): Promise<JobResultRecord> {
  const item: JobResultRecord = buildJobResultRecord(jobId, result);

  await dynamo.send(
    new PutCommand({
      TableName: getTableName(),
      Item: item
    })
  );

  return item;
}

export async function listRecentUserJobs(userId: string): Promise<UserJobItem[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: getTableName(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :jobPrefix)",
      ExpressionAttributeValues: {
        ":jobPrefix": "JOB#",
        ":pk": userPk(userId)
      },
      ScanIndexForward: false
    })
  );

  return (result.Items as UserJobItem[] | undefined) ?? [];
}
