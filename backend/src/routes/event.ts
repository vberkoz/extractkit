import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { ok } from "../http/responses";
import { createIntentEvent } from "../repositories/event-repo";
import { parseIntentEventRequest } from "../parsing/intent-event";

export async function handleCreateIntentEvent(
  event: Parameters<typeof parseIntentEventRequest>[0]
): Promise<APIGatewayProxyResultV2> {
  const input = parseIntentEventRequest(event);
  const created = await createIntentEvent(input);

  return ok({
    eventId: created.eventId,
    capturedAt: created.createdAt
  });
}
