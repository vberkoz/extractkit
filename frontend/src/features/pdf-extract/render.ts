import { renderDemandFollowupPrompt } from "../demand-capture/render";
import { renderWorkspaceExamplePicker } from "../workspace/examples";
import { renderWorkspaceProofBlock } from "../workspace/proof";

export function renderPdfExtractPanel(): string {
  return `
    <section class="tab-panel" data-panel="pdf-extract" id="panel-pdf-extract" role="tabpanel" aria-labelledby="tab-pdf-extract" hidden>
      <div class="tab-panel-header">
        <div class="tab-panel-heading">
          <p class="tab-panel-kicker">PDF extract workspace</p>
          <h4>Pick a sample PDF, run it, then swap in your own file.</h4>
        </div>
        <p class="tab-panel-copy">Use this when the source document lives at a public PDF URL and should be processed before extraction.</p>
      </div>
      ${renderWorkspaceExamplePicker({
        kind: "pdf",
        label: "Pick a use case",
        hint: "Start with a document example so you can see the workflow before wiring in your own file URL."
      })}
      <div class="panel-grid">
        <label class="field field-full">
          <span class="field-label">PDF URL</span>
          <input id="pdf-url-input" class="text-input" type="url" placeholder="https://example.com/report.pdf" />
        </label>
        <label class="field">
          <span class="field-label">Schema JSON</span>
          <textarea id="pdf-schema" class="textarea code-input" rows="12"></textarea>
        </label>
      </div>
      <div class="actions">
        <button id="extract-pdf" class="button button-primary" type="button">Extract PDF</button>
        <p id="pdf-status" class="status" aria-live="polite"></p>
      </div>
      ${renderWorkspaceProofBlock({
        rawLabel: "Raw input example",
        rawPreviewId: "pdf-raw-input",
        rawPlaceholder: "Select a sample PDF or paste a file URL to preview the source used for extraction.",
        resultLabel: "Structured result",
        resultId: "pdf-result",
        resultPlaceholder: "Run a PDF extraction to see the response.",
        changeSummary: "Changed: a document URL was turned into structured document fields instead of a file blob.",
        whyItMatters:
          "it helps visitors see whether the PDF use case is worth building before they wire up file handling."
      })}
      ${renderDemandFollowupPrompt()}
    </section>
  `;
}
