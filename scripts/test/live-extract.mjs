import { assert, parseJsonResponse } from "./lib/helpers.mjs";
import { SAMPLE_TEXT_EXTRACT_REQUEST } from "./lib/fixtures.mjs";
import { getApiKey, getBaseUrl } from "../lib/runtime-config.mjs";

const baseUrl = getBaseUrl();
const apiKey = getApiKey();

await run();

async function run() {
  console.log(`Base URL: ${baseUrl}`);

  const response = await fetch(new URL("/v1/extract", baseUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(SAMPLE_TEXT_EXTRACT_REQUEST)
  });

  const responseBody = await parseJsonResponse(response);

  console.log(`Status: ${response.status}`);
  console.log(JSON.stringify(responseBody, null, 2));

  assert(response.ok, "Extract request failed.");

  const data = responseBody?.data?.data;
  assert(data?.companyName === "Acme Inc", "Expected companyName to equal 'Acme Inc'.");
  assert(data?.contactEmail === "hello@acme.com", "Expected contactEmail to be parsed.");
  assert(data?.price === 1200.5, "Expected price to equal 1200.5.");
  assert(data?.active === true, "Expected active to equal true.");
  assert(data?.launchedOn === "2025-03-04", "Expected launchedOn to be normalized to 2025-03-04.");
  assert(Array.isArray(data?.tags) && data.tags.join(",") === "alpha,beta", "Expected tags array.");
  assert(
    Array.isArray(data?.scores) &&
      data.scores.length === 3 &&
      data.scores[0] === 10 &&
      data.scores[1] === 20 &&
      data.scores[2] === 30,
    "Expected scores array."
  );
  assert(data?.website === "https://acme.com", "Expected website to be parsed.");

  console.log("Live extract test passed.");
}
