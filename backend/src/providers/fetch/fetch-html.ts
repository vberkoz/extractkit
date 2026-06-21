import {
  BROWSER_RENDER_URL,
  FETCH_TIMEOUT_MS,
  MAX_FETCH_BYTES
} from "../../config/env";
import { HttpError } from "../../http/errors";
import { tryBrowserRenderedFallback, shouldTryBrowserRenderFallback } from "./browser-render";
import {
  createUpstreamFetchError,
  isAbortError,
  readResponseTextWithLimit
} from "./common";
import { buildBrowserLikeFetchHeaders } from "./headers";

export async function fetchUrlHtml(url: string): Promise<string> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: buildBrowserLikeFetchHeaders(url),
      redirect: "follow",
      referrerPolicy: "strict-origin-when-cross-origin",
      signal: abortController.signal
    });

    if (!response.ok) {
      if (shouldTryBrowserRenderFallback(response.status)) {
        const fallbackHtml = await tryBrowserRenderedFallback(url, response.status);

        if (fallbackHtml !== null) {
          return fallbackHtml;
        }
      }

      throw createUpstreamFetchError(response.status, BROWSER_RENDER_URL);
    }

    const html = await readResponseTextWithLimit(response, MAX_FETCH_BYTES);

    if (html.trim() === "") {
      throw new HttpError(422, "EMPTY_CONTENT", "Fetched URL did not contain readable HTML.");
    }

    return html;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (isAbortError(error)) {
      throw new HttpError(504, "FETCH_TIMEOUT", "Fetching the URL timed out.");
    }

    throw new HttpError(502, "UPSTREAM_FETCH_FAILED", "Failed to fetch URL content.");
  } finally {
    clearTimeout(timeout);
  }
}
