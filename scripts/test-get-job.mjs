const DEFAULT_BASE_URL =
  "https://acum3ewi3r5xkcyjuehtgnryy40upocf.lambda-url.us-east-1.on.aws";
const DEFAULT_API_KEY =
  "ek_live_541b52ba75561b5f18f5b8ff39379ca589e35586921bc230";

const baseUrl = process.env.EXTRACTKIT_BASE_URL ?? DEFAULT_BASE_URL;
const apiKey = process.env.EXTRACTKIT_API_KEY ?? DEFAULT_API_KEY;

const createJobRequestBody = {
  pdfUrl: "https://example.com/file.pdf",
  schema: {
    invoiceNumber: "string",
    totalAmount: "number",
    vendorEmail: "email"
  }
};

const createJobResponse = await fetch(new URL("/v1/extract-pdf", baseUrl), {
  method: "POST",
  headers: {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json"
  },
  body: JSON.stringify(createJobRequestBody)
});

const createJobBody = await parseResponseBody(createJobResponse);

console.log(`Create job status: ${createJobResponse.status}`);
console.log(JSON.stringify(createJobBody, null, 2));

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

const getJobBody = await parseResponseBody(getJobResponse);

console.log(`Get job status: ${getJobResponse.status}`);
console.log(JSON.stringify(getJobBody, null, 2));

if (!getJobResponse.ok) {
  process.exitCode = 1;
}

function parseResponseBody(response) {
  return response.text().then((text) => {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  });
}
