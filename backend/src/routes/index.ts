import { HttpError } from "../http/errors";
import { handleExtract } from "./extract";
import { handleExtractPdf } from "./extract-pdf";
import { handleExtractUrl } from "./extract-url";
import { handleHealth } from "./health";
import { handleGetJob } from "./jobs";
import type { RouteHandler } from "./types";
import { handleGetUsage } from "./usage";

type RouteDefinition = {
  requireAuth: boolean;
  handler: RouteHandler;
};

const ROUTES: RouteDefinition[] = [
  {
    requireAuth: false,
    handler: (event) => handleHealth(event)
  },
  {
    requireAuth: true,
    handler: (event, auth) => {
      if (!auth) {
        throw new HttpError(500, "MISSING_AUTH_CONTEXT", "Auth context is required.");
      }

      return handleExtract(event, auth);
    }
  },
  {
    requireAuth: true,
    handler: (event, auth) => {
      if (!auth) {
        throw new HttpError(500, "MISSING_AUTH_CONTEXT", "Auth context is required.");
      }

      return handleExtractUrl(event, auth);
    }
  },
  {
    requireAuth: true,
    handler: (event, auth) => {
      if (!auth) {
        throw new HttpError(500, "MISSING_AUTH_CONTEXT", "Auth context is required.");
      }

      return handleExtractPdf(event, auth);
    }
  },
  {
    requireAuth: true,
    handler: (event, auth) => {
      if (!auth) {
        throw new HttpError(500, "MISSING_AUTH_CONTEXT", "Auth context is required.");
      }

      return handleGetJob(event, auth);
    }
  },
  {
    requireAuth: true,
    handler: (_event, auth) => {
      if (!auth) {
        throw new HttpError(500, "MISSING_AUTH_CONTEXT", "Auth context is required.");
      }

      return handleGetUsage(auth);
    }
  }
];

export function resolveRoute(method: string, path: string): RouteDefinition {
  if (method === "GET" && path === "/v1/health") {
    return ROUTES[0];
  }

  if (method === "POST" && path === "/v1/extract") {
    return ROUTES[1];
  }

  if (method === "POST" && path === "/v1/extract-url") {
    return ROUTES[2];
  }

  if (method === "POST" && path === "/v1/extract-pdf") {
    return ROUTES[3];
  }

  if (method === "GET" && path.startsWith("/v1/jobs/")) {
    return ROUTES[4];
  }

  if (method === "GET" && path === "/v1/usage") {
    return ROUTES[5];
  }

  throw new HttpError(404, "NOT_FOUND", `Route not found: ${method} ${path}`);
}
