import { renderDemandFollowupPrompt } from "../demand-capture/render";
import { renderWorkspaceExamplePicker } from "../workspace/examples";
import { renderWorkspaceProofBlock } from "../workspace/proof";

export function renderTextExtractPanel(): string {
  return `
    <section class="tab-panel is-active" data-panel="text-extract" id="panel-text-extract" role="tabpanel" aria-labelledby="tab-text-extract">
      <div class="tab-panel-header">
        <div class="tab-panel-heading">
          <p class="tab-panel-kicker">Text extract workspace</p>
          <h4>Pick a sample, run it, then swap in your own text.</h4>
        </div>
        <p class="tab-panel-copy">Use this view for notes, pasted records, transcripts, and other freeform text.</p>
      </div>
      ${renderWorkspaceExamplePicker({
        kind: "text",
        label: "Pick a use case",
        hint: "Start with a runnable text example so you can see the extraction shape before editing the source."
      })}
      <div class="panel-grid">
        <label class="field">
          <span class="field-label">Content</span>
          <textarea id="text-content" class="textarea" rows="12" placeholder="name: Jane Doe&#10;email: jane@example.com&#10;company: ExtractKit"></textarea>
        </label>
        <label class="field">
          <span class="field-label">Schema JSON</span>
          <textarea id="text-schema" class="textarea code-input" rows="12"></textarea>
        </label>
      </div>
      <div class="actions">
        <button id="extract-text" class="button button-primary" type="button">Extract</button>
        <p id="text-status" class="status" aria-live="polite"></p>
      </div>
      ${renderWorkspaceProofBlock({
        rawLabel: "Raw input example",
        rawPreviewId: "text-raw-input",
        rawPlaceholder: "Select a sample or type freeform text to preview the input used for extraction.",
        resultLabel: "Structured result",
        resultId: "text-result",
        resultPlaceholder: "Run a text extraction to see the response.",
        changeSummary: "Changed: freeform notes were normalized into named fields the model can return consistently.",
        whyItMatters:
          "it makes the extraction easy to compare, validate, and hand off to a downstream workflow."
      })}
      ${renderDemandFollowupPrompt()}
    </section>
  `;
}
