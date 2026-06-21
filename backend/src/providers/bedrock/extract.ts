import { NOVA_MICRO_MODEL_ID } from "../../config/env";
import type { ExtractRequest, HtmlExtractionHints } from "../../domain/extraction";
import type { JsonValue } from "../../domain/json";
import { getConverseTextResponse, parseJsonValueFromModelText } from "../../parsing/model-json";
import { ConverseCommand, getBedrockRuntimeClient } from "./client";
import { buildModelExtractionPrompt } from "./prompt";

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
          text: [
            "You extract structured data from user-provided content.",
            "Return only valid JSON matching the provided schema shape as closely as possible.",
            "Use null when a value is missing or not supported by the content.",
            "Do not include markdown fences or explanatory text."
          ].join(" ")
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
      inferenceConfig: {
        maxTokens: 1200,
        temperature: 0
      }
    })
  );
  const text = getConverseTextResponse(response.output?.message?.content);

  if (!text) {
    return null;
  }

  return parseJsonValueFromModelText(text);
}
