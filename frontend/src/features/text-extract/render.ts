export function renderTextExtractPanel(): string {
  return `
    <section class="tab-panel is-active" data-panel="text-extract" id="panel-text-extract" role="tabpanel" aria-labelledby="tab-text-extract">
      <div class="tab-panel-header">
        <div class="tab-panel-heading">
          <p class="tab-panel-kicker">Text extract workspace</p>
          <h4>Paste raw content and shape the extraction result.</h4>
        </div>
        <p class="tab-panel-copy">Use this view for notes, pasted records, transcripts, and other freeform text.</p>
      </div>
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
      <div class="result-block">
        <div class="result-header">
          <h3>Result JSON</h3>
        </div>
        <pre id="text-result" class="result-viewer">Run a text extraction to see the response.</pre>
      </div>
    </section>
  `;
}
