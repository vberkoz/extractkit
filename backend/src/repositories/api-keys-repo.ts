import { randomUUID } from "node:crypto";
import { GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { getTableName } from "../config/env";
import { apiKeyPk, dynamo, DynamoRecord } from "./dynamo-client";
import {
  buildApiKeyRecord,
  buildUserRecord,
  createCreatedApiKey
} from "./api-key-records";

export type ApiKeyItem = DynamoRecord & {
  PK: string;
  SK: "METADATA";
  apiKeyId: string;
  apiKeyHash: string;
  userId: string;
  plan: string;
  disabled?: boolean;
};

export type CreatedApiKey = {
  apiKeyId: string;
  apiKeyHash: string;
  rawApiKey: string;
  userId: string;
  plan: string;
};

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

export async function createApiKey(plan: string = "dev"): Promise<CreatedApiKey> {
  const createdAt = new Date().toISOString();
  const userId = `dev_${randomUUID()}`;
  const created = createCreatedApiKey({
    createdAt,
    plan,
    userId
  });

  await dynamo.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: getTableName(),
            Item: buildUserRecord({ createdAt, plan, userId }),
            ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
          }
        },
        {
          Put: {
            TableName: getTableName(),
            Item: buildApiKeyRecord({ createdAt, plan, userId }, created),
            ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
          }
        }
      ]
    })
  );

  return {
    apiKeyId: created.apiKeyId,
    apiKeyHash: created.apiKeyHash,
    rawApiKey: created.rawApiKey,
    userId: created.userId,
    plan: created.plan
  };
}
