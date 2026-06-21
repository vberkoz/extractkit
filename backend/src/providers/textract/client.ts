import {
  DetectDocumentTextCommand,
  TextractClient,
  type Block
} from "@aws-sdk/client-textract";
import { BEDROCK_REGION } from "../../config/env";

let textractClient: TextractClient | null = null;

export function getTextractClient(): TextractClient {
  if (textractClient) {
    return textractClient;
  }

  textractClient = new TextractClient({
    region: BEDROCK_REGION
  });

  return textractClient;
}

export { Block, DetectDocumentTextCommand };
