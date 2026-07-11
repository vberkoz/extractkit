import { API_KEY_STORAGE_KEY } from "../config/runtime";
import type { ApiResponse } from "./types";
import { loadStoredValue } from "./storage";

type DevApiKeyResponse = {
  apiKey: string;
};

export async function ensureApiKey(apiBaseUrl: string): Promise<string> {
  const storedApiKey = loadStoredValue(API_KEY_STORAGE_KEY).trim();

  if (storedApiKey) {
    return storedApiKey;
  }

  const response = await fetch(`${apiBaseUrl}/v1/dev-api-key`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    }
  });

  const payload = (await response.json()) as ApiResponse<DevApiKeyResponse>;

  if (!response.ok || !payload.ok) {
    throw new Error(
      payload.ok
        ? `Request failed with status ${response.status}.`
        : payload.error.message
    );
  }

  if (!payload.data.apiKey) {
    throw new Error("API key bootstrap response was empty.");
  }

  localStorage.setItem(API_KEY_STORAGE_KEY, payload.data.apiKey);
  return payload.data.apiKey;
}
