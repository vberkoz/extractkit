import { setStatus } from "../../lib/dom";
import { parseSchema } from "../../lib/schema";
import { revealDemandFollowups } from "../demand-capture/controller";
import { runAction } from "../workspace/shared/actions";
import { bindWorkspaceExamplePicker } from "../workspace/examples";
import { bindWorkspaceProofSnapshot, syncWorkspaceProofSnapshot } from "../workspace/proof";
import { getTextExtractElements } from "./selectors";
import { trackIntentEvent } from "../../lib/telemetry";

export function initTextExtractFeature(callApi: <T>(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  }
) => Promise<T>): void {
  const elements = getTextExtractElements();
  let activeExampleId = "";
  let activeExampleLabel = "";
  let activeSchema = "";
  let schemaEditedTracked = false;

  bindWorkspaceExamplePicker({
    kind: "text",
    inputId: "text-example-value",
    applyExample: (example) => {
      activeExampleId = example.id;
      activeExampleLabel = example.label;
      activeSchema = example.schema;
      schemaEditedTracked = false;
      elements.contentInput.value = example.content ?? "";
      elements.schemaInput.value = example.schema;
      syncWorkspaceProofSnapshot(elements.contentInput, elements.rawInputPreview, "Select a sample or type freeform text to preview the input used for extraction.");
    },
    onSelect: (example) => {
      void trackIntentEvent({
        eventType: "sample_selected",
        surface: "workspace",
        sampleKind: "text",
        useCaseId: example.id,
        useCaseLabel: example.label
      });
    }
  });
  bindSchemaEditTracker();
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
      onStart: () => {
        void trackIntentEvent({
          eventType: "extraction_started",
          surface: "workspace",
          sampleKind: "text",
          useCaseId: activeExampleId,
          useCaseLabel: activeExampleLabel,
          schemaEdited: schemaEditedTracked
        });
      },
      onSuccess: () => {
        void trackIntentEvent({
          eventType: "extraction_succeeded",
          surface: "workspace",
          sampleKind: "text",
          useCaseId: activeExampleId,
          useCaseLabel: activeExampleLabel,
          schemaEdited: schemaEditedTracked
        });
        revealDemandFollowups();
      },
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

  function bindSchemaEditTracker(): void {
    elements.schemaInput.addEventListener("input", () => {
      if (schemaEditedTracked || elements.schemaInput.value === activeSchema) {
        return;
      }

      schemaEditedTracked = true;
      void trackIntentEvent({
        eventType: "schema_edited",
        surface: "workspace",
        sampleKind: "text",
        useCaseId: activeExampleId,
        useCaseLabel: activeExampleLabel,
        schemaEdited: true
      });
    });
  }
}
