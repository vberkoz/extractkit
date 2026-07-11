export function renderHeroSection(): string {
  return `
    <section id="hero" class="hero stats-hero section-stack">
      <div class="section-heading hero-heading">
        <p class="eyebrow">structured extraction for developer teams</p>
        <h1>Ship extraction flows with the feel of an ops dashboard.</h1>
        <p class="section-copy">
          Test text, URL, and PDF extraction from one clean surface, with live usage visibility and local API key bootstrap running quietly in the background.
        </p>
      </div>

      <div class="stats-actions hero-actions">
        <a class="button button-primary" href="#demo">Open live demo</a>
      </div>

      <section class="stats-grid hero-metrics" aria-label="Product highlights">
        <article class="panel stat-card stat-card-accent">
          <span class="stat-label">Extraction surfaces</span>
          <strong>3</strong>
          <span class="stat-note">Text, URL, and PDF workflows in one place</span>
        </article>
        <article class="panel stat-card">
          <span class="stat-label">API routes</span>
          <strong>4</strong>
          <span class="stat-note">Extract, usage, stats, and bootstrap</span>
        </article>
        <article class="panel stat-card">
          <span class="stat-label">Key handling</span>
          <strong>1 click</strong>
          <span class="stat-note">Saved to localStorage under the hood</span>
        </article>
        <article class="panel stat-card">
          <span class="stat-label">Docs examples</span>
          <strong>2</strong>
          <span class="stat-note">Copy-ready request snippets for fast integration</span>
        </article>
      </section>

      <section class="stats-panels hero-panels">
        <article class="panel stats-panel">
          <div class="panel-heading">
            <p class="workspace-kicker">Traffic mix</p>
            <h3>What the home surface covers</h3>
          </div>
          <div class="endpoint-bars" aria-label="Product surface mix">
            <div class="endpoint-row">
              <span>Text extract</span>
              <div class="endpoint-bar"><span style="width: 100%"></span></div>
              <strong>Ready</strong>
            </div>
            <div class="endpoint-row">
              <span>URL extract</span>
              <div class="endpoint-bar"><span style="width: 100%"></span></div>
              <strong>Ready</strong>
            </div>
            <div class="endpoint-row">
              <span>PDF extract</span>
              <div class="endpoint-bar"><span style="width: 100%"></span></div>
              <strong>Ready</strong>
            </div>
          </div>
        </article>

        <article class="panel stats-panel">
          <div class="panel-heading">
            <p class="workspace-kicker">Runtime</p>
            <h3>Hidden setup, visible product</h3>
          </div>
          <div class="stats-list">
            <div class="stat-line">
              <span>API key bootstrap</span>
              <strong>Automatic</strong>
            </div>
            <div class="stat-line">
              <span>Storage</span>
              <strong>localStorage</strong>
            </div>
            <div class="stat-line">
              <span>Usage visibility</span>
              <strong>Built in</strong>
            </div>
            <div class="stat-line">
              <span>Stats route</span>
              <strong>Live</strong>
            </div>
          </div>
        </article>
      </section>
    </section>
  `;
}
