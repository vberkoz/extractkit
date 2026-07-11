import { randomUUID } from "node:crypto";

export function createJobId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}
