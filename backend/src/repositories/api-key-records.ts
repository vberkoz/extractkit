import { createHash, randomUUID } from "node:crypto";
import type { CreatedApiKey } from "./api-keys-repo";
import { apiKeyPk } from "./dynamo-client";

export type ApiKeyRecordInput = {
  createdAt: string;
  plan: string;
  userId: string;
};

export type ApiKeyRecordShape = {
  PK: string;
  SK: "METADATA";
  entityType: "API_KEY" | "USER";
  createdAt: string;
  disabled: false;
  plan: string;
  userId: string;
};

export function createCreatedApiKey(input: ApiKeyRecordInput): CreatedApiKey & {
  createdAt: string;
  keyPrefix: string;
} {
  const apiKeyId = `ak_${randomUUID()}`;
  const rawApiKey = `ek_live_${randomUUID().replaceAll("-", "")}${randomUUID().replaceAll("-", "")}`;
  const apiKeyHash = createHash("sha256").update(rawApiKey).digest("hex");

  return {
    apiKeyId,
    apiKeyHash,
    rawApiKey,
    userId: input.userId,
    plan: input.plan,
    createdAt: input.createdAt,
    keyPrefix: rawApiKey.slice(0, 16)
  };
}

export function buildUserRecord(input: ApiKeyRecordInput): ApiKeyRecordShape {
  return {
    PK: `USER#${input.userId}`,
    SK: "METADATA",
    entityType: "USER",
    userId: input.userId,
    plan: input.plan,
    disabled: false,
    createdAt: input.createdAt
  };
}

export function buildApiKeyRecord(
  input: ApiKeyRecordInput,
  created: CreatedApiKey & { createdAt: string; keyPrefix: string }
): ApiKeyRecordShape & {
  apiKeyHash: string;
  apiKeyId: string;
  keyPrefix: string;
} {
  return {
    PK: apiKeyPk(created.apiKeyHash),
    SK: "METADATA",
    entityType: "API_KEY",
    apiKeyId: created.apiKeyId,
    apiKeyHash: created.apiKeyHash,
    userId: input.userId,
    plan: input.plan,
    disabled: false,
    createdAt: input.createdAt,
    keyPrefix: created.keyPrefix
  };
}
