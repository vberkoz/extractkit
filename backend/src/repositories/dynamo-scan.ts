import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getTableName } from "../config/env";
import { dynamo, DynamoRecord } from "./dynamo-client";

export async function scanAllItems<TItem extends DynamoRecord>(
  projectionExpression: string,
  expressionAttributeNames: Record<string, string>
): Promise<TItem[]> {
  const items: TItem[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: getTableName(),
        ExclusiveStartKey: exclusiveStartKey,
        ProjectionExpression: projectionExpression,
        ExpressionAttributeNames: expressionAttributeNames
      })
    );

    items.push(...((result.Items as TItem[] | undefined) ?? []));
    exclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey);

  return items;
}
