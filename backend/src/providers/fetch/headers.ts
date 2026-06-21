import {
  FETCH_ACCEPT,
  FETCH_ACCEPT_LANGUAGE,
  FETCH_USER_AGENT
} from "../../config/env";

export function buildBrowserLikeFetchHeaders(url: string): Record<string, string> {
  let referer = url;

  try {
    const parsed = new URL(url);
    referer = `${parsed.protocol}//${parsed.host}/`;
  } catch {
    referer = url;
  }

  return {
    accept: FETCH_ACCEPT,
    "accept-language": FETCH_ACCEPT_LANGUAGE,
    "cache-control": "no-cache",
    pragma: "no-cache",
    priority: "u=0, i",
    referer,
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent": FETCH_USER_AGENT
  };
}
