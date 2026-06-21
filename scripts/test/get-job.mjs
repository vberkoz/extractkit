import { logJsonResult, parseJsonResponse } from "./lib/helpers.mjs";
import { SAMPLE_PDF_EXTRACT_REQUEST } from "./lib/fixtures.mjs";
import { getApiKey, getBaseUrl } from "../lib/runtime-config.mjs";

const baseUrl = getBaseUrl();
const apiKey = getApiKey();

const createJobResponse = await fetch(new URL("/v1/extract-pdf", baseUrl), {
  method: "POST",
  headers: {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json"
  },
  body: JSON.stringify(SAMPLE_PDF_EXTRACT_REQUEST)
});

const createJobBody = await parseJsonResponse(createJobResponse);
logJsonResult("Create job", createJobResponse.status, createJobBody);

if (!createJobResponse.ok) {
  process.exitCode = 1;
  process.exit();
}

const jobId = createJobBody?.data?.jobId;

if (typeof jobId !== "string" || jobId === "") {
  console.error("Missing jobId in create job response.");
  process.exitCode = 1;
  process.exit();
}

const getJobResponse = await fetch(new URL(`/v1/jobs/${jobId}`, baseUrl), {
  method: "GET",
  headers: {
    authorization: `Bearer ${apiKey}`
  }
});

const getJobBody = await parseJsonResponse(getJobResponse);
logJsonResult("Get job", getJobResponse.status, getJobBody);

if (!getJobResponse.ok) {
  process.exitCode = 1;
}
