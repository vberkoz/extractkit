import { assert, logJsonResult, parseJsonResponse } from "./lib/helpers.mjs";
import {
  SAMPLE_TEXT_EXTRACT_REQUEST,
  SAMPLE_URL_EXTRACT_REQUEST
} from "./lib/fixtures.mjs";
const frontendUrl =
  process.env.EXTRACTKIT_FRONTEND_URL ?? "https://extractkit.vberkoz.com";
const apiUrl =
  process.env.EXTRACTKIT_API_URL ?? "https://extractkit-api.vberkoz.com";
const apiKey = process.env.EXTRACTKIT_API_KEY;

await run();

async function run() {
  assert(typeof apiKey === "string" && apiKey.length > 0, "Missing EXTRACTKIT_API_KEY.");

  console.log(`Frontend URL: ${frontendUrl}`);
  console.log(`API URL: ${apiUrl}`);

  const frontendResponse = await fetch(frontendUrl);
  const frontendHtml = await frontendResponse.text();
  console.log(`\nFrontend status: ${frontendResponse.status}`);
  assert(frontendResponse.ok, "Frontend request failed.");
  assert(frontendHtml.includes("<title>ExtractKit</title>"), "Frontend title was not found.");
  assert(frontendHtml.includes('src="./app.js"'), "Frontend bundle script tag was not found.");

  const healthResponse = await fetch(new URL("/v1/health", apiUrl));
  const healthBody = await parseJsonResponse(healthResponse);
  logJsonResult("Health", healthResponse.status, healthBody);
  assert(healthResponse.ok, "Health request failed.");
  assert(healthBody?.ok === true, "Health response did not return ok=true.");

  const usageResponse = await fetch(new URL("/v1/usage", apiUrl), {
    method: "GET",
    headers: {
      authorization: `Bearer ${apiKey}`
    }
  });
  const usageBody = await parseJsonResponse(usageResponse);
  logJsonResult("Usage", usageResponse.status, usageBody);
  assert(usageResponse.ok, "Usage request failed.");
  assert(typeof usageBody?.data?.used === "number", "Usage response did not include used.");
  assert(typeof usageBody?.data?.limit === "number", "Usage response did not include limit.");
  assert(typeof usageBody?.data?.plan === "string", "Usage response did not include plan.");

  const textExtractResponse = await fetch(new URL("/v1/extract", apiUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      ...SAMPLE_TEXT_EXTRACT_REQUEST,
      options: {
        mode: "sync"
      }
    })
  });
  const textExtractBody = await parseJsonResponse(textExtractResponse);
  logJsonResult("Text extract", textExtractResponse.status, textExtractBody);
  assert(textExtractResponse.ok, "Text extract request failed.");

  const extractedData = textExtractBody?.data?.data;
  assert(extractedData?.companyName === "Acme Inc", "Expected companyName to equal 'Acme Inc'.");
  assert(
    extractedData?.contactEmail === "hello@acme.com",
    "Expected contactEmail to equal 'hello@acme.com'."
  );
  assert(extractedData?.price === 1200.5, "Expected price to equal 1200.5.");
  assert(extractedData?.active === true, "Expected active to equal true.");
  assert(extractedData?.launchedOn === "2025-03-04", "Expected launchedOn to equal 2025-03-04.");
  assert(
    Array.isArray(extractedData?.tags) && extractedData.tags.join(",") === "alpha,beta",
    "Expected tags array."
  );
  assert(
    Array.isArray(extractedData?.scores) &&
      extractedData.scores.length === 3 &&
      extractedData.scores[0] === 10 &&
      extractedData.scores[1] === 20 &&
      extractedData.scores[2] === 30,
    "Expected scores array."
  );
  assert(extractedData?.website === "https://acme.com", "Expected website to be parsed.");

  const urlExtractResponse = await fetch(new URL("/v1/extract-url", apiUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(SAMPLE_URL_EXTRACT_REQUEST)
  });
  const urlExtractBody = await parseJsonResponse(urlExtractResponse);
  logJsonResult("URL extract", urlExtractResponse.status, urlExtractBody);
  assert(urlExtractResponse.ok, "URL extract request failed.");
  assert(
    typeof urlExtractBody?.data?.data?.title === "string" &&
      urlExtractBody.data.data.title.length > 0,
    "Expected URL extract response to include a title."
  );

  console.log("\nFrontend/API live smoke test passed.");
}
