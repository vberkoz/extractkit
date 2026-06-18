import { getApiKey, getBaseUrl } from "./lib/runtime-config.mjs";

const baseUrl = getBaseUrl();
const apiKey = getApiKey();

const createJobRequestBody = {
  pdfUrl: "https://example.com/file.pdf",
  schema: {
    invoiceNumber: "string",
    totalAmount: "number",
    vendorEmail: "email"
  }
};

await run();

async function run() {
  console.log(`Base URL: ${baseUrl}`);

  const healthResponse = await fetch(new URL("/v1/health", baseUrl));
  const healthBody = await parseResponseBody(healthResponse);
  logResult("Health", healthResponse.status, healthBody);
  assert(healthResponse.ok, "Health check failed.");

  const usageResponse = await fetch(new URL("/v1/usage", baseUrl), {
    method: "GET",
    headers: {
      authorization: `Bearer ${apiKey}`
    }
  });
  const usageBody = await parseResponseBody(usageResponse);
  logResult("Usage", usageResponse.status, usageBody);
  assert(usageResponse.ok, "Usage request failed.");
  assert(
    typeof usageBody?.data?.month === "string" &&
      typeof usageBody?.data?.used === "number" &&
      typeof usageBody?.data?.limit === "number" &&
      typeof usageBody?.data?.plan === "string",
    "Usage response did not match the expected shape."
  );

  const createJobResponse = await fetch(new URL("/v1/extract-pdf", baseUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(createJobRequestBody)
  });
  const createJobBody = await parseResponseBody(createJobResponse);
  logResult("Create job", createJobResponse.status, createJobBody);
  assert(createJobResponse.ok, "Create job request failed.");

  const jobId = createJobBody?.data?.jobId;
  assert(typeof jobId === "string" && jobId.length > 0, "Missing jobId in create job response.");

  const getJobResponse = await fetch(new URL(`/v1/jobs/${jobId}`, baseUrl), {
    method: "GET",
    headers: {
      authorization: `Bearer ${apiKey}`
    }
  });
  const getJobBody = await parseResponseBody(getJobResponse);
  logResult("Get job", getJobResponse.status, getJobBody);
  assert(getJobResponse.ok, "Get job request failed.");
  assert(getJobBody?.data?.jobId === jobId, "Fetched job did not match the created job.");

  console.log("Smoke test passed.");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function logResult(label, status, body) {
  console.log(`\n${label} status: ${status}`);
  console.log(JSON.stringify(body, null, 2));
}

async function parseResponseBody(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
