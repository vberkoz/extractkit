import type { APIGatewayProxyResultV2, Handler } from "aws-lambda";

type LambdaResponse = APIGatewayProxyResultV2;

export const handler: Handler<unknown, LambdaResponse> = async () => {
  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      service: "extractkit",
      status: "ok",
      timestamp: new Date().toISOString()
    })
  };
};
