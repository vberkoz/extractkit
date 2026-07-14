import { handleCreateDevApiKey } from "./dev-api-key";
import { handleExtract } from "./extract";
import { handleExtractPdf } from "./extract-pdf";
import { handleExtractUrl } from "./extract-url";
import { handleCreateInterestCapture } from "./interest";
import { handleGetJob } from "./jobs";
import { handleHealth } from "./health";
import { handleGetStats } from "./stats";
import { handleGetUsage } from "./usage";
import type { RouteHandler } from "./types";
import { authRoute } from "./helpers";

export type RouteDefinition = {
  requireAuth: boolean;
  matches: (method: string, path: string) => boolean;
  handler: RouteHandler;
};

function exactRoute(method: string, path: string): (nextMethod: string, nextPath: string) => boolean {
  return (nextMethod, nextPath) => nextMethod === method && nextPath === path;
}

function jobRoute(method: string, pathPrefix: string): (nextMethod: string, nextPath: string) => boolean {
  return (nextMethod, nextPath) => nextMethod === method && nextPath.startsWith(pathPrefix);
}

export const ROUTES: RouteDefinition[] = [
  {
    requireAuth: false,
    matches: exactRoute("GET", "/v1/health"),
    handler: (event) => handleHealth(event)
  },
  {
    requireAuth: true,
    matches: exactRoute("POST", "/v1/extract"),
    handler: authRoute((event, auth) => handleExtract(event, auth))
  },
  {
    requireAuth: true,
    matches: exactRoute("POST", "/v1/extract-url"),
    handler: authRoute((event, auth) => handleExtractUrl(event, auth))
  },
  {
    requireAuth: true,
    matches: exactRoute("POST", "/v1/extract-pdf"),
    handler: authRoute((event, auth) => handleExtractPdf(event, auth))
  },
  {
    requireAuth: true,
    matches: jobRoute("GET", "/v1/jobs/"),
    handler: authRoute((event, auth) => handleGetJob(event, auth))
  },
  {
    requireAuth: true,
    matches: exactRoute("GET", "/v1/usage"),
    handler: authRoute((_event, auth) => handleGetUsage(auth))
  },
  {
    requireAuth: false,
    matches: exactRoute("POST", "/v1/interest"),
    handler: (event) => handleCreateInterestCapture(event)
  },
  {
    requireAuth: false,
    matches: exactRoute("GET", "/v1/stats"),
    handler: () => handleGetStats()
  },
  {
    requireAuth: false,
    matches: exactRoute("POST", "/v1/dev-api-key"),
    handler: () => handleCreateDevApiKey()
  }
];
