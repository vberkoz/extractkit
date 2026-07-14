import { setStatus } from "../../lib/dom";
import { parseSchema } from "../../lib/schema";
import { revealDemandFollowups } from "../demand-capture/controller";
import { runAction } from "../workspace/shared/actions";
import { bindWorkspaceExamplePicker } from "../workspace/examples";
import { bindWorkspaceProofSnapshot, syncWorkspaceProofSnapshot } from "../workspace/proof";
import { getUrlExtractElements } from "./selectors";

export function initUrlExtractFeature(callApi: <T>(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  }
) => Promise<T>): void {
  const elements = getUrlExtractElements();
  bindWorkspaceExamplePicker({
    kind: "url",
    inputId: "url-example-value",
    applyExample: (example) => {
      elements.urlInput.value = example.url ?? "";
      elements.schemaInput.value = example.schema;
      syncWorkspaceProofSnapshot(elements.urlInput, elements.rawInputPreview, "Select a sample page or paste a URL to preview the source used for extraction.");
    }
  });
  bindWorkspaceProofSnapshot({
    input: elements.urlInput,
    preview: elements.rawInputPreview,
    placeholder: "Select a sample page or paste a URL to preview the source used for extraction."
  });

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
      onSuccess: revealDemandFollowups,
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
