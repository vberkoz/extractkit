import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { BEDROCK_REGION } from "../../config/env";

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  s3Client = new S3Client({
    region: BEDROCK_REGION
  });

  return s3Client;
}

export { DeleteObjectCommand, PutObjectCommand };
