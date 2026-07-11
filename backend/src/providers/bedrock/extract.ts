import { NOVA_MICRO_MODEL_ID } from "../../config/env";
import type { ExtractRequest, HtmlExtractionHints } from "../../domain/extraction";
import type { JsonValue } from "../../domain/json";
import { getConverseTextResponse, parseJsonValueFromModelText } from "../../parsing/model-json";
import { ConverseCommand, getBedrockRuntimeClient } from "./client";
import { buildModelExtractionPrompt } from "./prompt";
import { BEDROCK_EXTRACTION_INFERENCE_CONFIG } from "./inference";
import { buildExtractionSystemPrompt } from "./system";

export async function extractStructuredJsonWithBedrock(
  request: ExtractRequest,
  htmlHints?: HtmlExtractionHints,
  modelId = NOVA_MICRO_MODEL_ID
): Promise<JsonValue | null> {
  const response = await getBedrockRuntimeClient().send(
    new ConverseCommand({
      modelId,
      system: [
        {
          text: buildExtractionSystemPrompt()
        }
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              text: buildModelExtractionPrompt(request, htmlHints)
            }
          ]
        }
      ],
      inferenceConfig: BEDROCK_EXTRACTION_INFERENCE_CONFIG
    })
  );
  const text = getConverseTextResponse(response.output?.message?.content);

  if (!text) {
    return null;
  }

  return parseJsonValueFromModelText(text);
}
