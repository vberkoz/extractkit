import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { getTableName } from "../config/env";
import { apiKeyPk, dynamo, DynamoRecord } from "./dynamo-client";

export type ApiKeyItem = DynamoRecord & {
  PK: string;
  SK: "METADATA";
  apiKeyId: string;
  apiKeyHash: string;
  userId: string;
  plan: string;
  disabled?: boolean;
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
