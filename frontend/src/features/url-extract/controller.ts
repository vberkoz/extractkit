import { DEFAULT_URL_SCHEMA } from "../../config/defaults";
import { setStatus } from "../../lib/dom";
import { parseSchema } from "../../lib/schema";
import { runAction } from "../workspace/shared/actions";
import { getUrlExtractElements } from "./selectors";

export function initUrlExtractFeature(callApi: <T>(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  }
) => Promise<T>): void {
  const elements = getUrlExtractElements();

  elements.schemaInput.value = DEFAULT_URL_SCHEMA;

  elements.submitButton.addEventListener("click", async () => {
    const schema = parseSchema(elements.schemaInput.value);

    if (!schema.ok) {
      setStatus(elements.status, schema.message, "error");
      return;
    }

    await runAction({
      button: elements.submitButton,
      buttonLabel: "Extract URL",
      statusEl: elements.status,
      resultEl: elements.result,
      idleMessage: "Run a URL extraction to see the response.",
      pendingMessage: "Fetching and extracting URL...",
      successMessage: "URL extraction complete.",
      request: () =>
        callApi("/v1/extract-url", {
          method: "POST",
          body: {
            url: elements.urlInput.value,
            schema: schema.value
          }
        })
    });
  });
}
