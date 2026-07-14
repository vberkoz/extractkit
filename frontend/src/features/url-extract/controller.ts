import { setStatus } from "../../lib/dom";
import { parseSchema } from "../../lib/schema";
import { revealDemandFollowups } from "../demand-capture/controller";
import { runAction } from "../workspace/shared/actions";
import { bindWorkspaceExamplePicker } from "../workspace/examples";
import { bindWorkspaceProofSnapshot, syncWorkspaceProofSnapshot } from "../workspace/proof";
import { getUrlExtractElements } from "./selectors";
import { trackIntentEvent } from "../../lib/telemetry";

export function initUrlExtractFeature(callApi: <T>(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  }
) => Promise<T>): void {
  const elements = getUrlExtractElements();
  let activeExampleId = "";
  let activeExampleLabel = "";
  let activeSchema = "";
  let schemaEditedTracked = false;

  bindWorkspaceExamplePicker({
    kind: "url",
    inputId: "url-example-value",
    applyExample: (example) => {
      activeExampleId = example.id;
      activeExampleLabel = example.label;
      activeSchema = example.schema;
      schemaEditedTracked = false;
      elements.urlInput.value = example.url ?? "";
      elements.schemaInput.value = example.schema;
      syncWorkspaceProofSnapshot(elements.urlInput, elements.rawInputPreview, "Select a sample page or paste a URL to preview the source used for extraction.");
    },
    onSelect: (example) => {
      void trackIntentEvent({
        eventType: "sample_selected",
        surface: "workspace",
        sampleKind: "url",
        useCaseId: example.id,
        useCaseLabel: example.label
      });
    }
  });
  bindSchemaEditTracker();
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
      onStart: () => {
        void trackIntentEvent({
          eventType: "extraction_started",
          surface: "workspace",
          sampleKind: "url",
          useCaseId: activeExampleId,
          useCaseLabel: activeExampleLabel,
          schemaEdited: schemaEditedTracked
        });
      },
      onSuccess: () => {
        void trackIntentEvent({
          eventType: "extraction_succeeded",
          surface: "workspace",
          sampleKind: "url",
          useCaseId: activeExampleId,
          useCaseLabel: activeExampleLabel,
          schemaEdited: schemaEditedTracked
        });
        revealDemandFollowups();
      },
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

  function bindSchemaEditTracker(): void {
    elements.schemaInput.addEventListener("input", () => {
      if (schemaEditedTracked || elements.schemaInput.value === activeSchema) {
        return;
      }

      schemaEditedTracked = true;
      void trackIntentEvent({
        eventType: "schema_edited",
        surface: "workspace",
        sampleKind: "url",
        useCaseId: activeExampleId,
        useCaseLabel: activeExampleLabel,
        schemaEdited: true
      });
    });
  }
}
