import { parseJsonResponse } from "./lib/helpers.mjs";
import { getApiKey, getBaseUrl } from "../lib/runtime-config.mjs";

const baseUrl = getBaseUrl();
const apiKey = getApiKey();

const response = await fetch(new URL("/v1/usage", baseUrl), {
  method: "GET",
  headers: {
    authorization: `Bearer ${apiKey}`
  }
});

const responseBody = await parseJsonResponse(response);

console.log(`Status: ${response.status}`);
console.log(JSON.stringify(responseBody, null, 2));

if (!response.ok) {
  process.exitCode = 1;
} else {
  const data = responseBody?.data;
  const isValidShape =
    typeof data?.month === "string" &&
    typeof data?.used === "number" &&
    typeof data?.limit === "number" &&
    typeof data?.plan === "string";

  if (!isValidShape) {
    console.error("Response body did not match expected usage shape.");
    process.exitCode = 1;
  }
}
