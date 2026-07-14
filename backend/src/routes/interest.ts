import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { ok } from "../http/responses";
import { createInterestCapture } from "../repositories/interest-repo";
import { parseInterestCaptureRequest } from "../parsing/interest-capture";

export async function handleCreateInterestCapture(
  event: Parameters<typeof parseInterestCaptureRequest>[0]
): Promise<APIGatewayProxyResultV2> {
  const input = parseInterestCaptureRequest(event);
  const lead = await createInterestCapture(input);

  return ok({
    leadId: lead.leadId,
    capturedAt: lead.createdAt
  });
}
