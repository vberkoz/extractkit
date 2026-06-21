import {
  BROWSER_RENDER_AUTH_TOKEN,
  BROWSER_RENDER_TIMEOUT_MS,
  BROWSER_RENDER_URL,
  FETCH_USER_AGENT,
  MAX_FETCH_BYTES
} from "../../config/env";
import { HttpError } from "../../http/errors";
import { isRecord } from "../../parsing/common";
import { isAbortError, readResponseTextWithLimit } from "./common";

export function shouldTryBrowserRenderFallback(status: number): boolean {
  return status === 401 || status === 403 || status === 406 || status === 429;
}

export async function tryBrowserRenderedFallback(
  url: string,
  blockedStatus: number
): Promise<string | null> {
  if (BROWSER_RENDER_URL === "") {
    return null;
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort();
  }, BROWSER_RENDER_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      accept: "application/json,text/html;q=0.9,*/*;q=0.8",
      "content-type": "application/json",
      "user-agent": FETCH_USER_AGENT
    };

    if (BROWSER_RENDER_AUTH_TOKEN !== "") {
      headers.authorization = `Bearer ${BROWSER_RENDER_AUTH_TOKEN}`;
    }

    const response = await fetch(BROWSER_RENDER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        url,
        render: "html",
        waitUntil: "networkidle",
        sourceStatus: blockedStatus
      }),
      redirect: "follow",
      signal: abortController.signal
    });

    if (!response.ok) {
      throw new HttpError(
        502,
        "BROWSER_RENDER_FETCH_FAILED",
        `Direct fetch was blocked with ${blockedStatus}, and browser-render fallback responded with ${response.status}.`
      );
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const payload = await readResponseTextWithLimit(response, MAX_FETCH_BYTES);

      try {
        const parsed: unknown = JSON.parse(payload);

        if (isRecord(parsed) && typeof parsed.html === "string" && parsed.html.trim() !== "") {
          return parsed.html;
        }
      } catch {
        throw new HttpError(
          502,
          "BROWSER_RENDER_FETCH_FAILED",
          "Browser-render fallback returned invalid JSON."
        );
      }

      throw new HttpError(
        502,
        "BROWSER_RENDER_FETCH_FAILED",
        "Browser-render fallback JSON response did not include an 'html' string."
      );
    }

    const html = await readResponseTextWithLimit(response, MAX_FETCH_BYTES);
    return html.trim() === "" ? null : html;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (isAbortError(error)) {
      throw new HttpError(
        504,
        "BROWSER_RENDER_TIMEOUT",
        "Browser-render fallback timed out."
      );
    }

    throw new HttpError(
      502,
      "BROWSER_RENDER_FETCH_FAILED",
      "Browser-render fallback failed."
    );
  } finally {
    clearTimeout(timeout);
  }
}
