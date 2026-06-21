import {
  FETCH_ACCEPT_LANGUAGE,
  FETCH_TIMEOUT_MS,
  FETCH_USER_AGENT,
  MAX_PDF_FETCH_BYTES
} from "../../config/env";
import { HttpError } from "../../http/errors";
import {
  createUpstreamFetchError,
  isAbortError,
  readResponseBytesWithLimit
} from "./common";

export async function fetchPdfBytes(url: string): Promise<Uint8Array> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
        "accept-language": FETCH_ACCEPT_LANGUAGE,
        "user-agent": FETCH_USER_AGENT
      },
      redirect: "follow",
      signal: abortController.signal
    });

    if (!response.ok) {
      throw createUpstreamFetchError(response.status, "");
    }

    const bytes = await readResponseBytesWithLimit(response, MAX_PDF_FETCH_BYTES);
    return new Uint8Array(bytes);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (isAbortError(error)) {
      throw new HttpError(504, "FETCH_TIMEOUT", "Fetching the PDF timed out.");
    }

    throw new HttpError(502, "UPSTREAM_FETCH_FAILED", "Failed to fetch PDF content.");
  } finally {
    clearTimeout(timeout);
  }
}
