import { DEFAULT_TEXT_SCHEMA } from "../../config/defaults";
import { setStatus } from "../../lib/dom";
import { parseSchema } from "../../lib/schema";
import { runAction } from "../workspace/shared/actions";
import { getTextExtractElements } from "./selectors";

export function initTextExtractFeature(callApi: <T>(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  }
) => Promise<T>): void {
  const elements = getTextExtractElements();

  elements.schemaInput.value = DEFAULT_TEXT_SCHEMA;

  elements.submitButton.addEventListener("click", async () => {
    const schema = parseSchema(elements.schemaInput.value);

    if (!schema.ok) {
      setStatus(elements.status, schema.message, "error");
      return;
    }

    await runAction({
      button: elements.submitButton,
      statusEl: elements.status,
      resultEl: elements.result,
      idleMessage: "Run a text extraction to see the response.",
      pendingMessage: "Extracting text...",
      successMessage: "Text extraction complete.",
      request: () =>
        callApi("/v1/extract", {
          method: "POST",
          body: {
            content: elements.contentInput.value,
            schema: schema.value
          }
        })
    });
  });
}
