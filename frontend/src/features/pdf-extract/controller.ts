import { setStatus } from "../../lib/dom";
import { parseSchema } from "../../lib/schema";
import { revealDemandFollowups } from "../demand-capture/controller";
import { runAction } from "../workspace/shared/actions";
import { bindWorkspaceExamplePicker } from "../workspace/examples";
import { bindWorkspaceProofSnapshot, syncWorkspaceProofSnapshot } from "../workspace/proof";
import { getPdfExtractElements } from "./selectors";
import { trackIntentEvent } from "../../lib/telemetry";

export function initPdfExtractFeature(callApi: <T>(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  }
) => Promise<T>): void {
  const elements = getPdfExtractElements();
  let activeExampleId = "";
  let activeExampleLabel = "";
  let activeSchema = "";
  let schemaEditedTracked = false;

  bindWorkspaceExamplePicker({
    kind: "pdf",
    inputId: "pdf-example-value",
    applyExample: (example) => {
      activeExampleId = example.id;
      activeExampleLabel = example.label;
      activeSchema = example.schema;
      schemaEditedTracked = false;
      elements.pdfUrlInput.value = example.pdfUrl
        ? new URL(example.pdfUrl, window.location.origin).toString()
        : "";
      elements.schemaInput.value = example.schema;
      syncWorkspaceProofSnapshot(elements.pdfUrlInput, elements.rawInputPreview, "Select a sample PDF or paste a file URL to preview the source used for extraction.");
    },
    onSelect: (example) => {
      void trackIntentEvent({
        eventType: "sample_selected",
        surface: "workspace",
        sampleKind: "pdf",
        useCaseId: example.id,
        useCaseLabel: example.label
      });
    }
  });
  bindSchemaEditTracker();
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
      onStart: () => {
        void trackIntentEvent({
          eventType: "extraction_started",
          surface: "workspace",
          sampleKind: "pdf",
          useCaseId: activeExampleId,
          useCaseLabel: activeExampleLabel,
          schemaEdited: schemaEditedTracked
        });
      },
      onSuccess: () => {
        void trackIntentEvent({
          eventType: "extraction_succeeded",
          surface: "workspace",
          sampleKind: "pdf",
          useCaseId: activeExampleId,
          useCaseLabel: activeExampleLabel,
          schemaEdited: schemaEditedTracked
        });
        revealDemandFollowups();
      },
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

  function bindSchemaEditTracker(): void {
    elements.schemaInput.addEventListener("input", () => {
      if (schemaEditedTracked || elements.schemaInput.value === activeSchema) {
        return;
      }

      schemaEditedTracked = true;
      void trackIntentEvent({
        eventType: "schema_edited",
        surface: "workspace",
        sampleKind: "pdf",
        useCaseId: activeExampleId,
        useCaseLabel: activeExampleLabel,
        schemaEdited: true
      });
    });
  }
}
