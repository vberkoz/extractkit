import { HttpError } from "../../http/errors";

export function createUpstreamFetchError(status: number, browserRenderUrl: string): HttpError {
  if (status === 403) {
    return new HttpError(
      502,
      "UPSTREAM_FETCH_BLOCKED",
      browserRenderUrl === ""
        ? "Failed to fetch URL content. The upstream site responded with 403 and appears to block direct server-side fetches. Configure EXTRACTKIT_BROWSER_RENDER_URL to enable browser-render fallback for blocked sites."
        : "Failed to fetch URL content directly. The upstream site responded with 403 and blocked the server-side fetch."
    );
  }

  if (status === 429) {
    return new HttpError(
      502,
      "UPSTREAM_FETCH_RATE_LIMITED",
      "Failed to fetch URL content. The upstream site responded with 429 and rate-limited the request."
    );
  }

  return new HttpError(
    502,
    "UPSTREAM_FETCH_FAILED",
    `Failed to fetch URL content. Upstream responded with ${status}.`
  );
}
