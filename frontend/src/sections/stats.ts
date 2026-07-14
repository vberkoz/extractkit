export function renderStatsSection(): string {
  return `
    <main class="layout stats-layout">
      <section class="stats-hero section-stack">
        <div class="section-heading">
          <p class="eyebrow">analytics</p>
          <h1>General stats for the product surface</h1>
          <p class="section-copy">
            A dedicated route for analytics, health, and growth metrics. These numbers are pulled from the live DynamoDB table that powers jobs, usage, and API keys.
          </p>
        </div>

        <div class="stats-actions">
          <a class="button button-primary" href="/#demo">Back to demo</a>
        </div>
        <p id="stats-status" class="status" aria-live="polite">Loading live stats...</p>
      </section>

      <section class="stats-grid">
        <article class="panel stat-card stat-card-accent">
          <span class="stat-label">Requests today</span>
          <strong id="stats-requests-today">-</strong>
          <span class="stat-note">Successful jobs created today</span>
        </article>
        <article class="panel stat-card">
          <span class="stat-label">Success rate</span>
          <strong id="stats-success-rate">-</strong>
          <span class="stat-note">Based on stored job records</span>
        </article>
        <article class="panel stat-card">
          <span class="stat-label">Active API keys</span>
          <strong id="stats-active-api-keys">-</strong>
          <span class="stat-note">Non-disabled keys in DynamoDB</span>
        </article>
        <article class="panel stat-card">
          <span class="stat-label">Monthly usage units</span>
          <strong id="stats-monthly-usage-units">-</strong>
          <span class="stat-note">Summed from the current month</span>
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
              <div class="endpoint-bar"><span id="stats-text-jobs-bar" style="width: 0%"></span></div>
              <strong id="stats-text-jobs">-</strong>
            </div>
            <div class="endpoint-row">
              <span>URL extract</span>
              <div class="endpoint-bar"><span id="stats-url-jobs-bar" style="width: 0%"></span></div>
              <strong id="stats-url-jobs">-</strong>
            </div>
            <div class="endpoint-row">
              <span>PDF extract</span>
              <div class="endpoint-bar"><span id="stats-pdf-jobs-bar" style="width: 0%"></span></div>
              <strong id="stats-pdf-jobs">-</strong>
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
              <span>Total jobs stored</span>
              <strong id="stats-total-jobs">-</strong>
            </div>
            <div class="stat-line">
              <span>Completed jobs today</span>
              <strong id="stats-completed-jobs-today">-</strong>
            </div>
            <div class="stat-line">
              <span>Avg. result size</span>
              <strong id="stats-average-result-size">-</strong>
            </div>
            <div class="stat-line">
              <span>Last updated</span>
              <strong id="stats-generated-at">-</strong>
            </div>
          </div>
        </article>
      </section>

      <section class="stats-panels demand-panels">
        <article class="panel stats-panel demand-panel">
          <div class="panel-heading">
            <p class="workspace-kicker">Follow-up requests</p>
            <h3>Who wants help after the demo</h3>
          </div>
          <div class="stats-list">
            <div class="stat-line">
              <span>Total requests</span>
              <strong id="stats-follow-up-total">-</strong>
            </div>
            <div class="stat-line">
              <span>Requested today</span>
              <strong id="stats-follow-up-today">-</strong>
            </div>
            <div class="stat-line">
              <span>Top source format</span>
              <strong id="stats-follow-up-top-source">-</strong>
            </div>
            <div class="stat-line">
              <span>Top cadence</span>
              <strong id="stats-follow-up-top-frequency">-</strong>
            </div>
            <div class="stat-line">
              <span>Latest request</span>
              <strong id="stats-follow-up-latest">-</strong>
            </div>
          </div>
        </article>

        <article class="panel stats-panel demand-panel">
          <div class="panel-heading">
            <p class="workspace-kicker">Intent funnel</p>
            <h3>How much proof the workspace is creating</h3>
          </div>
          <div class="stats-list">
            <div class="stat-line">
              <span>Hero CTA clicks</span>
              <strong id="stats-hero-cta-clicks">-</strong>
            </div>
            <div class="stat-line">
              <span>Sample selections</span>
              <strong id="stats-sample-selections">-</strong>
            </div>
            <div class="stat-line">
              <span>Schema edits</span>
              <strong id="stats-schema-edits">-</strong>
            </div>
            <div class="stat-line">
              <span>Extraction starts</span>
              <strong id="stats-extraction-started">-</strong>
            </div>
            <div class="stat-line">
              <span>Extraction successes</span>
              <strong id="stats-extraction-succeeded">-</strong>
            </div>
            <div class="stat-line">
              <span>Extraction success rate</span>
              <strong id="stats-extraction-success-rate">-</strong>
            </div>
            <div class="stat-line">
              <span>Top use case</span>
              <strong id="stats-top-use-case">-</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  `;
}
