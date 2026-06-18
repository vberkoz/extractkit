import { getApiKey, getBaseUrl } from "./lib/runtime-config.mjs";

const baseUrl = getBaseUrl();
const apiKey = getApiKey();

const requestBody = {
  pdfUrl: "https://example.com/file.pdf",
  schema: {
    invoiceNumber: "string",
    totalAmount: "number",
    vendorEmail: "email"
  }
};

const response = await fetch(new URL("/v1/extract-pdf", baseUrl), {
  method: "POST",
  headers: {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json"
  },
  body: JSON.stringify(requestBody)
});

const responseText = await response.text();
let responseBody;

try {
  responseBody = JSON.parse(responseText);
} catch {
  responseBody = responseText;
}

console.log(`Status: ${response.status}`);
console.log(JSON.stringify(responseBody, null, 2));

if (!response.ok) {
  process.exitCode = 1;
}
