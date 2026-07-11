import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import type { AuthContext } from "../domain/auth";
import { parseExtractRequest } from "../parsing/extract-request";
import { parseJsonBody } from "../parsing/body";
import { executeExtraction } from "../services/extraction-service";

export async function handleExtract(
  event: APIGatewayProxyEventV2,
  auth: AuthContext
): Promise<APIGatewayProxyResultV2> {
  const body = parseJsonBody(event);
  const request = parseExtractRequest(body);

  return executeExtraction({
    auth,
    jobPrefix: "extract",
    request,
    requestBody: body
  });
}
