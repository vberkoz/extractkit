import {
  type AuthContext
} from "../domain/auth";
import {
  type ExtractRequest,
  type ExtractResponse,
  type ExtractionEngineResult,
  type HtmlExtractionHints
} from "../domain/extraction";
import type { JsonValue } from "../domain/json";
import { HttpError } from "../http/errors";
import { createJob, saveJobResult } from "../repositories/jobs-repo";
import { incrementUsage } from "../repositories/usage-repo";
import { createJobId } from "../parsing/common";
import { extractStructuredJsonWithBedrock } from "../providers/bedrock/extract";
import { ok } from "../http/responses";

export async function executeExtraction(input: {
  auth: AuthContext;
  jobPrefix: string;
  request: ExtractRequest;
  requestBody: Record<string, JsonValue>;
  htmlHints?: HtmlExtractionHints;
}) {
  const jobId = createJobId(input.jobPrefix);
  const createdAt = new Date().toISOString();
  const extraction = await extractWithNovaMicro(input.request, input.htmlHints);

  const response: ExtractResponse = {
    jobId,
    data: extraction.data,
    confidence: extraction.confidence,
    usage: {
      units: 1
    }
  };

  await createJob({
    jobId,
    userId: input.auth.userId,
    createdAt,
    apiKeyId: input.auth.apiKeyId,
    status: "completed",
    request: input.requestBody
  });
  await saveJobResult(jobId, response);
  await incrementUsage(input.auth.userId, getCurrentUsagePeriod(), response.usage.units);

  return ok(response);
}

async function extractWithNovaMicro(
  request: ExtractRequest,
  htmlHints?: HtmlExtractionHints
): Promise<ExtractionEngineResult> {
  try {
    const data = await extractStructuredJsonWithBedrock(request, htmlHints);

    if (data === null) {
      throw new HttpError(
        502,
        "MODEL_RESPONSE_INVALID",
        "Amazon Nova Micro returned an empty or non-JSON response."
      );
    }

    return {
      data,
      confidence: 0.82
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    console.error("Nova Micro extraction failed", {
      message: error instanceof Error ? error.message : "Unknown error"
    });
    throw new HttpError(
      502,
      "MODEL_INVOCATION_FAILED",
      "Amazon Nova Micro extraction failed."
    );
  }
}

export function getCurrentUsagePeriod(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getPlanUsageLimit(plan: string): number {
  const normalizedPlan = plan.trim().toLowerCase();

  switch (normalizedPlan) {
    case "dev":
      return 10_000;
    default:
      return 10_000;
  }
}
