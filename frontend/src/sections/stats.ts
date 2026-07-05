export function renderStatsSection(): string {
  return `
    <main class="layout stats-layout">
      <section class="stats-hero section-stack">
        <div class="section-heading">
          <p class="eyebrow">analytics</p>
          <h1>General stats for the product surface</h1>
          <p class="section-copy">
            A dedicated route for analytics, health, and growth metrics. This page is ready for real data later, but it already gives the product its own URL and navigation.
          </p>
        </div>

        <div class="stats-actions">
          <a class="button button-primary" href="/#demo">Back to demo</a>
          <a class="button button-secondary" href="/#api">View API examples</a>
        </div>
      </section>

      <section class="stats-grid">
        <article class="panel stat-card stat-card-accent">
          <span class="stat-label">Requests today</span>
          <strong>1,284</strong>
          <span class="stat-note">+12.4% from yesterday</span>
        </article>
        <article class="panel stat-card">
          <span class="stat-label">Success rate</span>
          <strong>99.9%</strong>
          <span class="stat-note">Stable across all extraction flows</span>
        </article>
        <article class="panel stat-card">
          <span class="stat-label">Median latency</span>
          <strong>240 ms</strong>
          <span class="stat-note">Text and URL extraction combined</span>
        </article>
        <article class="panel stat-card">
          <span class="stat-label">Active API keys</span>
          <strong>48</strong>
          <span class="stat-note">7 new keys this week</span>
        </article>
      </section>

      <section class="stats-panels">
        <article class="panel stats-panel">
          <div class="panel-heading">
            <p class="workspace-kicker">Traffic mix</p>
            <h3>Requests by endpoint</h3>
          </div>
          <div class="endpoint-bars" aria-label="Endpoint request mix">
            <div class="endpoint-row">
              <span>Text extract</span>
              <div class="endpoint-bar"><span style="width: 56%"></span></div>
              <strong>56%</strong>
            </div>
            <div class="endpoint-row">
              <span>URL extract</span>
              <div class="endpoint-bar"><span style="width: 26%"></span></div>
              <strong>26%</strong>
            </div>
            <div class="endpoint-row">
              <span>PDF extract</span>
              <div class="endpoint-bar"><span style="width: 18%"></span></div>
              <strong>18%</strong>
            </div>
          </div>
        </article>

        <article class="panel stats-panel">
          <div class="panel-heading">
            <p class="workspace-kicker">Health</p>
            <h3>Operational snapshot</h3>
          </div>
          <div class="stats-list">
            <div class="stat-line">
              <span>Queued jobs</span>
              <strong>4</strong>
            </div>
            <div class="stat-line">
              <span>Failed jobs</span>
              <strong>0</strong>
            </div>
            <div class="stat-line">
              <span>Usage checks today</span>
              <strong>312</strong>
            </div>
            <div class="stat-line">
              <span>Avg. response size</span>
              <strong>18 KB</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  `;
}
