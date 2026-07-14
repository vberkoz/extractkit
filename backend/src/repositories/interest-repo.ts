import { randomUUID } from "node:crypto";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { getTableName } from "../config/env";
import { dynamo, DynamoRecord } from "./dynamo-client";
import type { InterestCaptureInput } from "../parsing/interest-capture";

export type InterestCaptureRecord = DynamoRecord & {
  PK: string;
  SK: "METADATA";
  entityType: "LEAD";
  leadId: string;
  createdAt: string;
  need: string;
  sourceFormat: string;
  frequency: string;
  entryPoint: string;
  contactEmail?: string;
};

export type CreateInterestCaptureInput = InterestCaptureInput;

export async function createInterestCapture(
  input: CreateInterestCaptureInput
): Promise<InterestCaptureRecord> {
  const leadId = `lead_${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const item: InterestCaptureRecord = {
    PK: `LEAD#${leadId}`,
    SK: "METADATA",
    entityType: "LEAD",
    leadId,
    createdAt,
    need: input.need,
    sourceFormat: input.sourceFormat,
    frequency: input.frequency,
    entryPoint: input.entryPoint,
    ...(input.contactEmail ? { contactEmail: input.contactEmail } : {})
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
