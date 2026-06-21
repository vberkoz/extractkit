import { randomBytes, createHash, randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

async function main(): Promise<void> {
  const tableName = getTableName();
  const createdAt = new Date().toISOString();
  const userId = `dev_${randomUUID()}`;
  const apiKeyId = `ak_${randomUUID()}`;
  const rawApiKey = `ek_live_${randomBytes(24).toString("hex")}`;
  const apiKeyHash = createHash("sha256").update(rawApiKey).digest("hex");
  const plan = "dev";

  await dynamo.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: tableName,
            Item: {
              PK: `USER#${userId}`,
              SK: "METADATA",
              entityType: "USER",
              userId,
              plan,
              disabled: false,
              createdAt
            },
            ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
          }
        },
        {
          Put: {
            TableName: tableName,
            Item: {
              PK: `APIKEY#${apiKeyHash}`,
              SK: "METADATA",
              entityType: "API_KEY",
              apiKeyId,
              apiKeyHash,
              userId,
              plan,
              disabled: false,
              createdAt,
              keyPrefix: rawApiKey.slice(0, 16)
            },
            ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
          }
        }
      ]
    })
  );

  console.log(`Created dev user ${userId}`);
  console.log(`Created API key ${apiKeyId}`);
  console.log(`Plan: ${plan}`);
  console.log("");
  console.log("Raw API key:");
  console.log(rawApiKey);
}

function getTableName(): string {
  const tableName = process.env.EXTRACTKIT_TABLE_NAME;

  if (!tableName) {
    throw new Error("Missing EXTRACTKIT_TABLE_NAME environment variable.");
  }

  return tableName;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to create API key: ${message}`);
  process.exitCode = 1;
});
