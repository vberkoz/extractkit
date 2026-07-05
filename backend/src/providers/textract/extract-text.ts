import { HttpError } from "../../http/errors";
import { uploadTemporaryPdf } from "../s3/upload-temporary-pdf";
import {
  Block,
  DetectDocumentTextCommand,
  GetDocumentTextDetectionCommand,
  type GetDocumentTextDetectionCommandOutput,
  getTextractClient,
  StartDocumentTextDetectionCommand
} from "./client";

const TEXTRACT_POLL_INTERVAL_MS = 1_000;
const TEXTRACT_MAX_POLL_ATTEMPTS = 20;

type TextractDocumentOptions = {
  mimeType?: "application/pdf" | "image/png" | "image/jpeg";
};

type S3ObjectReference = {
  bucketName: string;
  objectKey: string;
};

type TextractPdfSource = S3ObjectReference & {
  cleanup?: () => Promise<void>;
};

export async function extractDocumentTextWithTextract(
  documentBytes: Uint8Array,
  options: TextractDocumentOptions = {}
): Promise<string> {
  const mimeType = options.mimeType ?? "image/png";

  if (mimeType === "application/pdf") {
    return await extractPdfTextWithTextract(documentBytes);
  }

  try {
    const response = await getTextractClient().send(
      new DetectDocumentTextCommand({
        Document: {
          Bytes: documentBytes
        }
      })
    );

    return buildTextFromTextractBlocks(response.Blocks ?? []);
  } catch (error) {
    console.error("Textract image OCR failed", {
      message: error instanceof Error ? error.message : "Unknown error"
    });

    throw new HttpError(
      502,
      "PDF_OCR_FAILED",
      "Textract OCR failed for the supplied document."
    );
  }
}

async function extractPdfTextWithTextract(
  documentBytes: Uint8Array
): Promise<string> {
  const s3Object = await uploadPdfForTextract(documentBytes);

  try {
    const startResponse = await getTextractClient().send(
      new StartDocumentTextDetectionCommand({
        DocumentLocation: {
          S3Object: {
            Bucket: s3Object.bucketName,
            Name: s3Object.objectKey
          }
        }
      })
    );
    const jobId = startResponse.JobId;

    if (!jobId) {
      throw new Error("Textract did not return a job ID.");
    }

    const blocks = await waitForDocumentTextDetection(jobId);
    return buildTextFromTextractBlocks(blocks);
  } catch (error) {
    console.error("Textract PDF OCR failed", {
      bucketName: s3Object.bucketName,
      objectKey: s3Object.objectKey,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    throw new HttpError(
      502,
      "PDF_OCR_FAILED",
      "Textract OCR failed for the supplied document."
    );
  } finally {
    await s3Object.cleanup?.();
  }
}

async function uploadPdfForTextract(documentBytes: Uint8Array): Promise<TextractPdfSource> {
  const upload = await uploadTemporaryPdf(documentBytes);

  return {
    bucketName: upload.bucketName,
    objectKey: upload.objectKey,
    cleanup: upload.cleanup
  };
}

async function waitForDocumentTextDetection(jobId: string): Promise<Block[]> {
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

function buildTextFromTextractBlocks(blocks: Block[]): string {
  const linesByPage = new Map<number, string[]>();

  for (const block of blocks) {
    if (block.BlockType !== "LINE" || !block.Text) {
      continue;
    }

    const page = block.Page ?? 1;
    const lines = linesByPage.get(page) ?? [];
    lines.push(block.Text);
    linesByPage.set(page, lines);
  }

  return Array.from(linesByPage.entries())
    .sort(([left], [right]) => left - right)
    .map(([page, lines]) => [`Page ${page}`, ...lines].join("\n"))
    .join("\n\n")
    .trim();
}
