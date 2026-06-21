import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getTableName } from "../config/env";
import { dynamo, DynamoRecord, usageSk, userPk } from "./dynamo-client";

export type UsageRecord = DynamoRecord & {
  PK: string;
  SK: string;
  entityType: "USAGE";
  userId: string;
  yyyyMM: string;
  amount?: number;
  updatedAt: string;
};

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

export async function getUsage(userId: string, yyyyMM: string): Promise<UsageRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: getTableName(),
      Key: {
        PK: userPk(userId),
        SK: usageSk(yyyyMM)
      }
    })
  );

  return (result.Item as UsageRecord | undefined) ?? null;
}
