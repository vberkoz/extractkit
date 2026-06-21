import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export type DynamoRecord = Record<string, unknown>;

export const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

export function apiKeyPk(apiKeyHash: string): string {
  return `APIKEY#${apiKeyHash}`;
}

export function userPk(userId: string): string {
  return `USER#${userId}`;
}

export function usageSk(yyyyMM: string): string {
  return `USAGE#${yyyyMM}`;
}

export function jobPk(jobId: string): string {
  return `JOB#${jobId}`;
}

export function userJobSk(createdAt: string, jobId: string): string {
  return `JOB#${createdAt}#${jobId}`;
}
