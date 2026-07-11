import { HttpError } from "../../http/errors";
import { uploadTemporaryPdf } from "../s3/upload-temporary-pdf";
import {
  Block,
  DetectDocumentTextCommand,
  getTextractClient,
  StartDocumentTextDetectionCommand
} from "./client";
import { buildTextFromTextractBlocks } from "./format";
import { waitForDocumentTextDetection } from "./poll";

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
