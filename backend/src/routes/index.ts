import { HttpError } from "../http/errors";
import { ROUTES, type RouteDefinition } from "./table";

export function resolveRoute(method: string, path: string): RouteDefinition {
  for (const route of ROUTES) {
    if (route.matches(method, path)) {
      return route;
    }
  }

  throw new HttpError(404, "NOT_FOUND", `Route not found: ${method} ${path}`);
}
