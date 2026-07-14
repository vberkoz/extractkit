import { setStatus } from "../../lib/dom";
import { parseSchema } from "../../lib/schema";
import { revealDemandFollowups } from "../demand-capture/controller";
import { runAction } from "../workspace/shared/actions";
import { bindWorkspaceExamplePicker } from "../workspace/examples";
import { bindWorkspaceProofSnapshot, syncWorkspaceProofSnapshot } from "../workspace/proof";
import { getTextExtractElements } from "./selectors";

export function initTextExtractFeature(callApi: <T>(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  }
) => Promise<T>): void {
  const elements = getTextExtractElements();
  bindWorkspaceExamplePicker({
    kind: "text",
    inputId: "text-example-value",
    applyExample: (example) => {
      elements.contentInput.value = example.content ?? "";
      elements.schemaInput.value = example.schema;
      syncWorkspaceProofSnapshot(elements.contentInput, elements.rawInputPreview, "Select a sample or type freeform text to preview the input used for extraction.");
    }
  });
  bindWorkspaceProofSnapshot({
    input: elements.contentInput,
    preview: elements.rawInputPreview,
    placeholder: "Select a sample or type freeform text to preview the input used for extraction."
  });

  elements.submitButton.addEventListener("click", async () => {
    const schema = parseSchema(elements.schemaInput.value);

    if (!schema.ok) {
      setStatus(elements.status, schema.message, "error");
      return;
    }

    await runAction({
      button: elements.submitButton,
      buttonLabel: "Extract",
      statusEl: elements.status,
      resultEl: elements.result,
      idleMessage: "Run a text extraction to see the response.",
      pendingMessage: "Extracting text...",
      successMessage: "Text extraction complete.",
      onSuccess: revealDemandFollowups,
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
