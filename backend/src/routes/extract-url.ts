import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import type { AuthContext } from "../domain/auth";
import { HttpError } from "../http/errors";
import { extractHtmlHints, htmlToReadableText } from "../parsing/html";
import { parseExtractUrlRequest, parseJsonBody } from "../parsing/request";
import { fetchUrlHtml } from "../providers/fetch/fetch-html";
import { executeExtraction } from "../services/extraction-service";

export async function handleExtractUrl(
  event: APIGatewayProxyEventV2,
  auth: AuthContext
): Promise<APIGatewayProxyResultV2> {
  const body = parseJsonBody(event);
  const request = parseExtractUrlRequest(body);
  const html = await fetchUrlHtml(request.url);
  const content = htmlToReadableText(html);
  const hints = extractHtmlHints(html, request.url);

  if (content === "") {
    throw new HttpError(422, "EMPTY_CONTENT", "Fetched URL did not contain readable text.");
  }

  return executeExtraction({
    auth,
    jobPrefix: "url",
    request: {
      ...request.extractRequest,
      content
    },
    requestBody: body,
    htmlHints: hints
  });
}
