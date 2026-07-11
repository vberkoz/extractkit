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
    </main>
  `;
}
