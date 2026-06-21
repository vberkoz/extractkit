import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import type { AuthContext } from "../domain/auth";

export type RouteHandler = (
  event: APIGatewayProxyEventV2,
  auth: AuthContext | null
) => Promise<APIGatewayProxyResultV2>;
