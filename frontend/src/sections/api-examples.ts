export function renderApiExamplesSection(): string {
  return `
    <section id="api" class="section-stack">
      <div class="section-heading">
        <p class="eyebrow">example api</p>
        <h2>Request and response at a glance</h2>
      </div>

      <div class="api-grid">
        <article class="panel code-panel">
          <div class="panel-heading">
            <p class="workspace-kicker">Example API request</p>
            <h3><code>POST /v1/extract</code></h3>
          </div>
          <pre id="example-request" class="result-viewer code-block"></pre>
        </article>

        <article class="panel code-panel">
          <div class="panel-heading">
            <p class="workspace-kicker">Example response</p>
            <h3><code>200 OK</code></h3>
          </div>
          <pre id="example-response" class="result-viewer code-block"></pre>
        </article>
      </div>
    </section>
  `;
}
