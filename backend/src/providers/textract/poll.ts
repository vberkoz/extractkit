import {
  GetDocumentTextDetectionCommand,
  type GetDocumentTextDetectionCommandOutput,
  type Block,
  getTextractClient
} from "./client";

const TEXTRACT_POLL_INTERVAL_MS = 1_000;
const TEXTRACT_MAX_POLL_ATTEMPTS = 20;

export async function waitForDocumentTextDetection(jobId: string): Promise<Block[]> {
  for (let attempt = 0; attempt < TEXTRACT_MAX_POLL_ATTEMPTS; attempt += 1) {
    const response = await getTextractClient().send(
      new GetDocumentTextDetectionCommand({
        JobId: jobId,
        MaxResults: 1_000
      })
    );
    const status = response.JobStatus;

    if (status === "SUCCEEDED") {
      return await getAllDocumentTextDetectionBlocks(jobId, response);
    }

    if (status === "FAILED" || status === "PARTIAL_SUCCESS") {
      throw new Error(
        response.StatusMessage
        ?? `Textract job ended with status ${status ?? "UNKNOWN"}.`
      );
    }

    await wait(TEXTRACT_POLL_INTERVAL_MS);
  }

  throw new Error("Textract document OCR timed out.");
}

async function getAllDocumentTextDetectionBlocks(
  jobId: string,
  firstResponse: GetDocumentTextDetectionCommandOutput
): Promise<Block[]> {
  const blocks = [...(firstResponse.Blocks ?? [])];
  let nextToken = firstResponse.NextToken;

  while (nextToken) {
    const response = await getTextractClient().send(
      new GetDocumentTextDetectionCommand({
        JobId: jobId,
        MaxResults: 1_000,
        NextToken: nextToken
      })
    );

    blocks.push(...(response.Blocks ?? []));
    nextToken = response.NextToken;
  }

  return blocks;
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}
