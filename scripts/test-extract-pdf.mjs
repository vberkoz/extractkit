const DEFAULT_BASE_URL =
  "https://acum3ewi3r5xkcyjuehtgnryy40upocf.lambda-url.us-east-1.on.aws";
const DEFAULT_API_KEY =
  "ek_live_541b52ba75561b5f18f5b8ff39379ca589e35586921bc230";

const baseUrl = process.env.EXTRACTKIT_BASE_URL ?? DEFAULT_BASE_URL;
const apiKey = process.env.EXTRACTKIT_API_KEY ?? DEFAULT_API_KEY;

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
