import { randomUUID } from "node:crypto";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { getTableName } from "../config/env";
import { dynamo, DynamoRecord } from "./dynamo-client";
import type { IntentEventInput, IntentEventType, IntentSurface } from "../parsing/intent-event";

export type IntentEventRecord = DynamoRecord & {
  PK: string;
  SK: "METADATA";
  entityType: "EVENT";
  eventId: string;
  visitorId: string;
  eventType: IntentEventType;
  surface: IntentSurface;
  createdAt: string;
  sampleKind?: "text" | "url" | "pdf";
  useCaseId?: string;
  useCaseLabel?: string;
  schemaEdited?: boolean;
};

export async function createIntentEvent(
  input: IntentEventInput
): Promise<IntentEventRecord> {
  const eventId = `event_${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const item: IntentEventRecord = {
    PK: `EVENT#${eventId}`,
    SK: "METADATA",
    entityType: "EVENT",
    eventId,
    visitorId: input.visitorId,
    eventType: input.eventType,
    surface: input.surface,
    createdAt,
    ...(input.sampleKind ? { sampleKind: input.sampleKind } : {}),
    ...(input.useCaseId ? { useCaseId: input.useCaseId } : {}),
    ...(input.useCaseLabel ? { useCaseLabel: input.useCaseLabel } : {}),
    ...(input.schemaEdited === undefined ? {} : { schemaEdited: input.schemaEdited })
  };

  await dynamo.send(
    new PutCommand({
      TableName: getTableName(),
      Item: item,
      ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
    })
  );

  return item;
}
