import { renderDemandFollowupPrompt } from "../demand-capture/render";
import { renderWorkspaceExamplePicker } from "../workspace/examples";
import { renderWorkspaceProofBlock } from "../workspace/proof";

export function renderUrlExtractPanel(): string {
  return `
    <section class="tab-panel" data-panel="url-extract" id="panel-url-extract" role="tabpanel" aria-labelledby="tab-url-extract" hidden>
      <div class="tab-panel-header">
        <div class="tab-panel-heading">
          <p class="tab-panel-kicker">URL extract workspace</p>
          <h4>Pick a sample page, run it, then replace the URL.</h4>
        </div>
        <p class="tab-panel-copy">Use this when the source lives on the web and the API should fetch it first.</p>
      </div>
      ${renderWorkspaceExamplePicker({
        kind: "url",
        label: "Pick a use case",
        hint: "Start with a live page example so the demo is useful before you enter your own URL."
      })}
      <div class="panel-grid">
        <label class="field field-full">
          <span class="field-label">URL</span>
          <input id="url-input" class="text-input" type="url" placeholder="https://example.com/article" />
        </label>
        <label class="field">
          <span class="field-label">Schema JSON</span>
          <textarea id="url-schema" class="textarea code-input" rows="12"></textarea>
        </label>
      </div>
      <div class="actions">
        <button id="extract-url" class="button button-primary" type="button">Extract URL</button>
        <p id="url-status" class="status" aria-live="polite"></p>
      </div>
      ${renderWorkspaceProofBlock({
        rawLabel: "Raw input example",
        rawPreviewId: "url-raw-input",
        rawPlaceholder: "Select a sample page or paste a URL to preview the source used for extraction.",
        resultLabel: "Structured result",
        resultId: "url-result",
        resultPlaceholder: "Run a URL extraction to see the response.",
        changeSummary: "Changed: a live page was converted into normalized fields instead of an unstructured article view.",
        whyItMatters:
          "it shows whether the page can be turned into reusable data before you invest in scraping logic."
      })}
      ${renderDemandFollowupPrompt()}
    </section>
  `;
}
