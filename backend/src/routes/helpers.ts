import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { HttpError } from "../http/errors";
import type { AuthContext } from "../domain/auth";
import type { RouteHandler } from "./types";

export function authRoute(
  handler: (event: APIGatewayProxyEventV2, auth: AuthContext) => Promise<APIGatewayProxyResultV2>
): RouteHandler {
  return async (event, auth) => {
    if (!auth) {
      throw new HttpError(500, "MISSING_AUTH_CONTEXT", "Auth context is required.");
    }

    return handler(event, auth);
  };
}
