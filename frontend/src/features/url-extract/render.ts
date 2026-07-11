export function renderUrlExtractPanel(): string {
  return `
    <section class="tab-panel" data-panel="url-extract" id="panel-url-extract" role="tabpanel" aria-labelledby="tab-url-extract" hidden>
      <div class="tab-panel-header">
        <div class="tab-panel-heading">
          <p class="tab-panel-kicker">URL extract workspace</p>
          <h4>Fetch a page, convert it to readable text, and extract JSON.</h4>
        </div>
        <p class="tab-panel-copy">Use this when the source lives on the web and the API should fetch it first.</p>
      </div>
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
      <div class="result-block">
        <div class="result-header">
          <h3>Result JSON</h3>
        </div>
        <pre id="url-result" class="result-viewer">Run a URL extraction to see the response.</pre>
      </div>
    </section>
  `;
}
