import { API_BASE_URL } from "../../config/runtime";
import { renderDocsPanel } from "../docs/render";
import { renderTextExtractPanel } from "../text-extract/render";
import { renderUrlExtractPanel } from "../url-extract/render";
import { renderUsagePanel } from "../usage/render";

export function renderWorkspaceSection(): string {
  return `
    <section id="demo" class="section-stack">
      <div class="section-heading">
        <p class="eyebrow">dashboard / demo panel</p>
        <h2>Run the product from the page</h2>
        <p class="section-copy">
          The live workspace keeps the real extraction tools intact while fitting into a cleaner product-facing layout.
        </p>
      </div>

      <div class="workspace panel">
        <div class="workspace-header">
          <div>
            <p class="workspace-kicker">Live workspace</p>
            <h3>Text, URL, usage, and docs</h3>
          </div>
          <div class="workspace-badges">
            <span class="badge">Plain CSS</span>
            <span class="badge">TypeScript</span>
            <span class="badge">Responsive</span>
          </div>
        </div>

        <div class="tabs" role="tablist" aria-label="ExtractKit sections">
          <button class="tab-button is-active" type="button" role="tab" aria-selected="true" data-tab="text-extract">Text Extract</button>
          <button class="tab-button" type="button" role="tab" aria-selected="false" data-tab="url-extract">URL Extract</button>
          <button class="tab-button" type="button" role="tab" aria-selected="false" data-tab="usage">Usage</button>
          <button class="tab-button" type="button" role="tab" aria-selected="false" data-tab="docs">Docs</button>
        </div>

        <div id="workspace-panels" class="panel-stack">
          ${renderTextExtractPanel()}
          ${renderUrlExtractPanel()}
          ${renderUsagePanel(API_BASE_URL)}
          ${renderDocsPanel()}
        </div>
      </div>
    </section>
  `;
}
