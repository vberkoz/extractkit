import { API_BASE_URL } from "../../config/runtime";
import { buildCurlExample } from "../../lib/api";
import { getById } from "../../lib/dom";

export function initDocsFeature(): void {
  const docsExtract = getById<HTMLElement>("docs-extract");
  const docsExtractUrl = getById<HTMLElement>("docs-extract-url");

  const exampleRequestBody = {
    content: "name: Jane Doe\\nemail: jane@example.com\\ncompany: ExtractKit",
    schema: {
      name: "string",
      email: "email",
      company: "string"
    }
  };

  docsExtract.textContent = buildCurlExample(API_BASE_URL, "/v1/extract", exampleRequestBody);
  docsExtractUrl.textContent = buildCurlExample(API_BASE_URL, "/v1/extract-url", {
    url: "https://example.com/article",
    schema: {
      title: "string",
      summary: "string",
      publishedAt: "date"
    }
  });
}
