import { API_BASE_URL } from "../config/runtime";
import { buildCurlExample } from "../lib/api";
import { getById } from "../lib/dom";

export function initApiExamplesSection(): void {
  const exampleRequest = getById<HTMLElement>("example-request");
  const exampleResponse = getById<HTMLElement>("example-response");

  const exampleRequestBody = {
    content: "name: Jane Doe\\nemail: jane@example.com\\ncompany: ExtractKit",
    schema: {
      name: "string",
      email: "email",
      company: "string"
    }
  };

  exampleRequest.textContent = buildCurlExample(API_BASE_URL, "/v1/extract", exampleRequestBody);
  exampleResponse.textContent = JSON.stringify(
    {
      ok: true,
      data: {
        name: "Jane Doe",
        email: "jane@example.com",
        company: "ExtractKit"
      }
    },
    null,
    2
  );
}
