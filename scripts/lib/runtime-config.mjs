import { execFileSync } from "node:child_process";

const DEFAULT_BASE_URL =
  "https://acum3ewi3r5xkcyjuehtgnryy40upocf.lambda-url.us-east-1.on.aws";
const DEFAULT_API_KEY =
  "ek_live_541b52ba75561b5f18f5b8ff39379ca589e35586921bc230";

export function getApiKey() {
  return process.env.EXTRACTKIT_API_KEY ?? DEFAULT_API_KEY;
}

export function getBaseUrl() {
  return (
    process.env.EXTRACTKIT_BASE_URL ??
    getStackOutput("ApiUrl") ??
    getStackOutput("BackendFunctionUrl") ??
    DEFAULT_BASE_URL
  );
}

function getStackOutput(outputKey) {
  const stackName = process.env.STACK_NAME ?? "extractkit";
  const region = process.env.AWS_REGION ?? "us-east-1";
  const profile = process.env.AWS_PROFILE ?? "basil";

  try {
    const output = execFileSync(
      "aws",
      [
        "--profile",
        profile,
        "cloudformation",
        "describe-stacks",
        "--stack-name",
        stackName,
        "--region",
        region,
        "--query",
        `Stacks[0].Outputs[?OutputKey=='${outputKey}'].OutputValue | [0]`,
        "--output",
        "text"
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      }
    ).trim();

    if (output === "" || output === "None") {
      return null;
    }

    return output;
  } catch {
    return null;
  }
}
