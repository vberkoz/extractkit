import { setStatus } from "../../lib/dom";
import { parseSchema } from "../../lib/schema";
import { revealDemandFollowups } from "../demand-capture/controller";
import { runAction } from "../workspace/shared/actions";
import { bindWorkspaceExamplePicker } from "../workspace/examples";
import { bindWorkspaceProofSnapshot, syncWorkspaceProofSnapshot } from "../workspace/proof";
import { getPdfExtractElements } from "./selectors";

export function initPdfExtractFeature(callApi: <T>(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  }
) => Promise<T>): void {
  const elements = getPdfExtractElements();
  bindWorkspaceExamplePicker({
    kind: "pdf",
    inputId: "pdf-example-value",
    applyExample: (example) => {
      elements.pdfUrlInput.value = example.pdfUrl
        ? new URL(example.pdfUrl, window.location.origin).toString()
        : "";
      elements.schemaInput.value = example.schema;
      syncWorkspaceProofSnapshot(elements.pdfUrlInput, elements.rawInputPreview, "Select a sample PDF or paste a file URL to preview the source used for extraction.");
    }
  });
  bindWorkspaceProofSnapshot({
    input: elements.pdfUrlInput,
    preview: elements.rawInputPreview,
    placeholder: "Select a sample PDF or paste a file URL to preview the source used for extraction."
  });

  elements.submitButton.addEventListener("click", async () => {
    const schema = parseSchema(elements.schemaInput.value);

    if (!schema.ok) {
      setStatus(elements.status, schema.message, "error");
      return;
    }

    await runAction({
      button: elements.submitButton,
      buttonLabel: "Extract PDF",
      statusEl: elements.status,
      resultEl: elements.result,
      idleMessage: "Run a PDF extraction to see the response.",
      pendingMessage: "Fetching and extracting PDF...",
      successMessage: "PDF extraction complete.",
      onSuccess: revealDemandFollowups,
      request: () =>
        callApi("/v1/extract-pdf", {
          method: "POST",
          body: {
            pdfUrl: elements.pdfUrlInput.value,
            schema: schema.value
          }
        })
    });
  });
}
