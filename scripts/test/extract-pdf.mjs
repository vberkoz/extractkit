import { parseJsonResponse } from "./lib/helpers.mjs";
import { SAMPLE_PDF_EXTRACT_REQUEST } from "./lib/fixtures.mjs";
import { getApiKey, getBaseUrl } from "../lib/runtime-config.mjs";

const baseUrl = getBaseUrl();
const apiKey = getApiKey();

const response = await fetch(new URL("/v1/extract-pdf", baseUrl), {
  method: "POST",
  headers: {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json"
  },
  body: JSON.stringify(SAMPLE_PDF_EXTRACT_REQUEST)
});

const responseBody = await parseJsonResponse(response);

console.log(`Status: ${response.status}`);
console.log(JSON.stringify(responseBody, null, 2));

if (!response.ok) {
  process.exitCode = 1;
}
