import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import type { AuthContext } from "../domain/auth";
import { HttpError } from "../http/errors";
import { parseExtractPdfRequest, parseJsonBody } from "../parsing/request";
import { fetchPdfBytes } from "../providers/fetch/fetch-pdf";
import { extractPdfTextIntelligently } from "../providers/pdf/extract-text";
import { executeExtraction } from "../services/extraction-service";

export async function handleExtractPdf(
  event: APIGatewayProxyEventV2,
  auth: AuthContext
): Promise<APIGatewayProxyResultV2> {
  const body = parseJsonBody(event);
  const request = parseExtractPdfRequest(body);
  const pdfBytes = await fetchPdfBytes(request.pdfUrl);
  const pdfText = await extractPdfTextIntelligently(pdfBytes);

  if (pdfText.trim() === "") {
    throw new HttpError(
      422,
      "EMPTY_CONTENT",
      "The PDF did not contain extractable text."
    );
  }

  return executeExtraction({
    auth,
    jobPrefix: "pdf",
    request: {
      content: pdfText,
      schema: request.schema,
      options: request.options
    },
    requestBody: body
  });
}
