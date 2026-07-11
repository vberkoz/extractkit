export function renderPdfExtractPanel(): string {
  return `
    <section class="tab-panel" data-panel="pdf-extract" id="panel-pdf-extract" role="tabpanel" aria-labelledby="tab-pdf-extract" hidden>
      <div class="tab-panel-header">
        <div class="tab-panel-heading">
          <p class="tab-panel-kicker">PDF extract workspace</p>
          <h4>Fetch a PDF, extract its readable text, and shape the result JSON.</h4>
        </div>
        <p class="tab-panel-copy">Use this when the source document lives at a public PDF URL and should be processed before extraction.</p>
      </div>
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
      <div class="result-block">
        <div class="result-header">
          <h3>Result JSON</h3>
        </div>
        <pre id="pdf-result" class="result-viewer">Run a PDF extraction to see the response.</pre>
      </div>
    </section>
  `;
}
