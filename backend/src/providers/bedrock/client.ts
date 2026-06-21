import {
  BedrockRuntimeClient,
  ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import { BEDROCK_REGION } from "../../config/env";

let bedrockRuntimeClient: BedrockRuntimeClient | null = null;

export function getBedrockRuntimeClient(): BedrockRuntimeClient {
  if (bedrockRuntimeClient) {
    return bedrockRuntimeClient;
  }

  bedrockRuntimeClient = new BedrockRuntimeClient({
    region: BEDROCK_REGION
  });

  return bedrockRuntimeClient;
}

export { ConverseCommand };
