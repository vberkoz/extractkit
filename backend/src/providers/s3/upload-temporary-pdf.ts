import { randomUUID } from "node:crypto";
import { getFilesBucketName } from "../../config/env";
import { DeleteObjectCommand, getS3Client, PutObjectCommand } from "./client";

export type TemporaryPdfUpload = {
  bucketName: string;
  objectKey: string;
  cleanup: () => Promise<void>;
};

export async function uploadTemporaryPdf(documentBytes: Uint8Array): Promise<TemporaryPdfUpload> {
  const bucketName = getFilesBucketName();
  const objectKey = `textract-inputs/${randomUUID()}.pdf`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: documentBytes,
      ContentType: "application/pdf"
    })
  );

  return {
    bucketName,
    objectKey,
    cleanup: async () => {
      try {
        await getS3Client().send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: objectKey
          })
        );
      } catch (error) {
        console.warn("Temporary PDF cleanup failed", {
          bucketName,
          objectKey,
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  };
}
