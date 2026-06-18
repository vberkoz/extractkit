import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

type DynamoRecord = Record<string, unknown>;
type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ApiKeyItem = DynamoRecord & {
  PK: string;
  SK: "METADATA";
  apiKeyId: string;
  apiKeyHash: string;
  userId: string;
  plan: string;
  disabled?: boolean;
};

export type JobRecord = DynamoRecord & {
  PK: string;
  SK: "METADATA";
  jobId: string;
  userId: string;
  createdAt: string;
  status?: string;
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
};

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

export async function getApiKey(apiKeyHash: string): Promise<ApiKeyItem | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: getTableName(),
      Key: {
        PK: apiKeyPk(apiKeyHash),
        SK: "METADATA"
      }
    })
  );

  return (result.Item as ApiKeyItem | undefined) ?? null;
}

export async function incrementUsage(
  userId: string,
  yyyyMM: string,
  amount: number
): Promise<number> {
  const result = await dynamo.send(
    new UpdateCommand({
      TableName: getTableName(),
      Key: {
        PK: userPk(userId),
        SK: usageSk(yyyyMM)
      },
      UpdateExpression:
        "SET #entityType = if_not_exists(#entityType, :entityType), #userId = if_not_exists(#userId, :userId), #yyyyMM = if_not_exists(#yyyyMM, :yyyyMM), #updatedAt = :updatedAt ADD #amount :amount",
      ExpressionAttributeNames: {
        "#amount": "amount",
        "#entityType": "entityType",
        "#updatedAt": "updatedAt",
        "#userId": "userId",
        "#yyyyMM": "yyyyMM"
      },
      ExpressionAttributeValues: {
        ":amount": amount,
        ":entityType": "USAGE",
        ":updatedAt": new Date().toISOString(),
        ":userId": userId,
        ":yyyyMM": yyyyMM
      },
      ReturnValues: "UPDATED_NEW"
    })
  );

  return Number(result.Attributes?.amount ?? 0);
}

export async function createJob(job: CreateJobInput): Promise<void> {
  const jobItem: JobRecord = {
    PK: jobPk(job.jobId),
    SK: "METADATA",
    entityType: "JOB",
    ...job
  };

  const userJobItem: UserJobItem = {
    ...job,
    PK: userPk(job.userId),
    SK: userJobSk(job.createdAt, job.jobId),
    entityType: "USER_JOB",
    jobId: job.jobId,
    userId: job.userId,
    createdAt: job.createdAt,
    status: job.status
  };

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
  const item: JobResultRecord = {
    PK: jobPk(jobId),
    SK: "RESULT",
    entityType: "JOB_RESULT",
    jobId,
    result,
    updatedAt: new Date().toISOString()
  };

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

export type CreateJobInput = DynamoRecord & {
  jobId: string;
  userId: string;
  createdAt: string;
  status?: string;
};

function getTableName(): string {
  const tableName = process.env.EXTRACTKIT_TABLE_NAME;

  if (!tableName) {
    throw new Error("Missing EXTRACTKIT_TABLE_NAME environment variable.");
  }

  return tableName;
}

function apiKeyPk(apiKeyHash: string): string {
  return `APIKEY#${apiKeyHash}`;
}

function userPk(userId: string): string {
  return `USER#${userId}`;
}

function usageSk(yyyyMM: string): string {
  return `USAGE#${yyyyMM}`;
}

function jobPk(jobId: string): string {
  return `JOB#${jobId}`;
}

function userJobSk(createdAt: string, jobId: string): string {
  return `JOB#${createdAt}#${jobId}`;
}
