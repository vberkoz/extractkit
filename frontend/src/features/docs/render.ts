export function renderDocsPanel(): string {
  return `
    <section class="tab-panel" data-panel="docs" id="panel-docs" aria-labelledby="tab-docs" hidden>
      <div class="tab-panel-header">
        <div class="tab-panel-heading">
          <p class="tab-panel-kicker">Docs workspace</p>
          <h4>Copy example requests without leaving the live demo.</h4>
        </div>
        <p class="tab-panel-copy">Use these snippets as quick starting points for scripts and integrations.</p>
      </div>
      <div class="docs-grid">
        <article class="doc-card">
          <h3><code>POST /v1/extract</code></h3>
          <pre class="result-viewer code-block" id="docs-extract"></pre>
        </article>
        <article class="doc-card">
          <h3><code>POST /v1/extract-url</code></h3>
          <pre class="result-viewer code-block" id="docs-extract-url"></pre>
        </article>
      </div>
    </section>
  `;
}
