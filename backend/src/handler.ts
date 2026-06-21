import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Handler
} from "aws-lambda";
import { handleError, noContent } from "./http/responses";
import { normalizePath } from "./parsing/common";
import { resolveRoute } from "./routes";
import { authenticateRequest } from "./services/auth-service";

export const handler: Handler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
> = async (event) => {
  try {
    const method = event.requestContext.http.method.toUpperCase();
    const path = normalizePath(event.rawPath);

    if (method === "OPTIONS") {
      return noContent();
    }

    const route = resolveRoute(method, path);
    const auth = route.requireAuth ? await authenticateRequest(event) : null;

    return await route.handler(event, auth);
  } catch (error) {
    return handleError(error);
  }
};
