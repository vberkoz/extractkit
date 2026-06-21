export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function logJsonResult(label, status, body) {
  console.log(`\n${label} status: ${status}`);
  console.log(JSON.stringify(body, null, 2));
}

export async function parseJsonResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
