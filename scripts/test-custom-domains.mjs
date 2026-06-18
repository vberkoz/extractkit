const frontendUrl =
  process.env.EXTRACTKIT_FRONTEND_URL ?? "https://extractkit.vberkoz.com";
const apiUrl =
  process.env.EXTRACTKIT_API_URL ?? "https://extractkit-api.vberkoz.com";
const apiKey =
  process.env.EXTRACTKIT_API_KEY ??
  "ek_live_541b52ba75561b5f18f5b8ff39379ca589e35586921bc230";

const extractRequestBody = {
  content: [
    "companyName: Acme Inc",
    "contactEmail: hello@acme.com",
    "price: $1,200.50",
    "active: yes",
    "launchedOn: March 4, 2025",
    "tags: alpha, beta",
    "scores: 10, 20, 30",
    "website: https://acme.com"
  ].join("\n"),
  schema: {
    companyName: "string",
    contactEmail: "email",
    price: "number",
    active: "boolean",
    launchedOn: "date",
    tags: "array:string",
    scores: "array:number",
    website: "url"
  },
  options: {
    mode: "sync",
    debug: true
  }
};

await run();

async function run() {
  console.log(`Frontend URL: ${frontendUrl}`);
  console.log(`API URL: ${apiUrl}`);

  const frontendResponse = await fetch(frontendUrl);
  const frontendHtml = await frontendResponse.text();
  console.log(`Frontend status: ${frontendResponse.status}`);
  assert(frontendResponse.ok, "Frontend request failed.");
  assert(frontendHtml.includes("<title>ExtractKit</title>"), "Frontend title was not found.");
  assert(frontendHtml.includes('id="app"'), "Frontend status placeholder was not found.");

  const healthResponse = await fetch(new URL("/v1/health", apiUrl));
  const healthBody = await parseJson(healthResponse);
  console.log(`Health status: ${healthResponse.status}`);
  console.log(JSON.stringify(healthBody, null, 2));
  assert(healthResponse.ok, "Health request failed.");
  assert(healthBody?.ok === true, "Health response did not return ok=true.");

  const extractResponse = await fetch(new URL("/v1/extract", apiUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(extractRequestBody)
  });
  const extractBody = await parseJson(extractResponse);
  console.log(`Extract status: ${extractResponse.status}`);
  console.log(JSON.stringify(extractBody, null, 2));

  assert(extractResponse.ok, "Extract request failed.");

  const data = extractBody?.data?.data;
  assert(data?.companyName === "Acme Inc", "Expected companyName to equal 'Acme Inc'.");
  assert(data?.contactEmail === "hello@acme.com", "Expected contactEmail to be parsed.");
  assert(data?.price === 1200.5, "Expected price to equal 1200.5.");
  assert(data?.active === true, "Expected active to equal true.");
  assert(data?.launchedOn === "2025-03-04", "Expected launchedOn to equal 2025-03-04.");
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

  console.log("Custom domain smoke test passed.");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function parseJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
