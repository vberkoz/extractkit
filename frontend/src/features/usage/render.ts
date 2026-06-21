export function renderUsagePanel(apiBaseUrl: string): string {
  return `
    <section class="tab-panel" data-panel="usage" id="panel-usage" aria-labelledby="tab-usage" hidden>
      <div class="tab-panel-header">
        <div class="tab-panel-heading">
          <p class="tab-panel-kicker">Usage workspace</p>
          <h4>Inspect plan limits and current-month request consumption.</h4>
        </div>
        <p class="tab-panel-copy">This panel makes a live authenticated request when you open it.</p>
      </div>
      <div class="usage-card">
        <div class="usage-metrics">
          <article class="metric">
            <span class="metric-label">Used</span>
            <strong id="usage-used">-</strong>
          </article>
          <article class="metric">
            <span class="metric-label">Limit</span>
            <strong id="usage-limit">-</strong>
          </article>
          <article class="metric">
            <span class="metric-label">Plan</span>
            <strong id="usage-plan">-</strong>
          </article>
        </div>
        <div class="actions">
          <button id="refresh-usage" class="button button-secondary" type="button">Refresh Usage</button>
          <p id="usage-status" class="status" aria-live="polite"></p>
        </div>
        <p class="microcopy">This view calls <code>GET /v1/usage</code> against <code>${apiBaseUrl}</code>.</p>
      </div>
    </section>
  `;
}
