const DEFAULT_BASE_URL =
  "https://acum3ewi3r5xkcyjuehtgnryy40upocf.lambda-url.us-east-1.on.aws";
const DEFAULT_API_KEY =
  "ek_live_541b52ba75561b5f18f5b8ff39379ca589e35586921bc230";

const baseUrl = process.env.EXTRACTKIT_BASE_URL ?? DEFAULT_BASE_URL;
const apiKey = process.env.EXTRACTKIT_API_KEY ?? DEFAULT_API_KEY;

const response = await fetch(new URL("/v1/usage", baseUrl), {
  method: "GET",
  headers: {
    authorization: `Bearer ${apiKey}`
  }
});

const responseBody = await parseResponseBody(response);

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

function parseResponseBody(response) {
  return response.text().then((text) => {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  });
}
