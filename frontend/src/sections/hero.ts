export function renderHeroSection(): string {
  return `
    <section id="hero" class="hero section-grid">
      <div class="hero-copy panel panel-hero">
        <p class="eyebrow">structured extraction for developer teams</p>
        <h1>Ship extraction flows with a clean, inspectable client.</h1>
        <p class="lead">
          Test text extraction, fetch-and-extract from a URL, inspect usage, and copy request examples from one lightweight interface.
        </p>
        <div class="hero-actions">
          <a class="button button-primary" href="#demo">Open live demo</a>
          <a class="button button-secondary" href="#api">View API examples</a>
        </div>
        <label class="field field-inline">
          <span class="field-label">API key</span>
          <input id="api-key" class="text-input" type="password" placeholder="Paste your ExtractKit API key" autocomplete="off" />
        </label>
        <p class="microcopy">
          Stored locally via <code>localStorage</code>. Live requests send <code>Authorization: Bearer ...</code>.
        </p>
      </div>

      <aside class="hero-panel panel panel-dark" aria-label="Dashboard preview">
        <div class="terminal-window">
          <div class="terminal-bar">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="terminal-body">
            <p>POST /v1/extract</p>
            <p class="terminal-dim">status: 200 OK</p>
            <p>{</p>
            <p>  "company": {</p>
            <p>    "name": "Acme Inc",</p>
            <p>    "website": "https://acme.com"</p>
            <p>  }</p>
            <p>}</p>
          </div>
        </div>
        <div class="dashboard-grid">
          <article class="mini-stat">
            <span class="mini-label">Latency</span>
            <strong>240ms</strong>
          </article>
          <article class="mini-stat">
            <span class="mini-label">Success</span>
            <strong>99.9%</strong>
          </article>
          <article class="mini-stat">
            <span class="mini-label">Schema fields</span>
            <strong>12</strong>
          </article>
          <article class="mini-stat">
            <span class="mini-label">Requests today</span>
            <strong>1,284</strong>
          </article>
        </div>
      </aside>
    </section>
  `;
}
