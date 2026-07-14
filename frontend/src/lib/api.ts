import { ApiResponse } from "./types";

// Creates a small typed API client for authenticated browser requests.
export function createApiClient(options: {
  apiBaseUrl: string;
  getApiKey: () => string;
}) {
  return async function callApi<T>(
    path: string,
    init: {
      method: "GET" | "POST";
      body?: Record<string, unknown>;
    }
  ): Promise<T> {
    const apiKey = options.getApiKey().trim();

    if (!apiKey) {
      throw new Error("Add an API key first.");
    }

    const response = await fetch(`${options.apiBaseUrl}${path}`, {
      method: init.method,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: init.body ? JSON.stringify(init.body) : undefined
    });

    const payload = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !payload.ok) {
      const fieldMessages = payload.ok
        ? ""
        : payload.error.fields
          ? ` ${JSON.stringify(payload.error.fields)}`
          : "";

      throw new Error(
        payload.ok
          ? `Request failed with status ${response.status}.`
          : `${payload.error.message}${fieldMessages}`
      );
    }

    return payload.data;
  };
}

export async function postPublicJson<T>(
  apiBaseUrl: string,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.ok) {
    throw new Error(
      payload.ok
        ? `Request failed with status ${response.status}.`
        : payload.error.message
    );
  }

  return payload.data;
}

export function buildCurlExample(
  apiBaseUrl: string,
  path: string,
  body: Record<string, unknown>
): string {
  return `curl -X POST "${apiBaseUrl}${path}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body, null, 2)}'`;
}
