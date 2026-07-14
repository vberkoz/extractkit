import { renderPdfExtractPanel } from "../pdf-extract/render";
import { renderTextExtractPanel } from "../text-extract/render";
import { renderUrlExtractPanel } from "../url-extract/render";

export function renderWorkspaceSection(): string {
  return `
    <section id="demo" class="section-stack">
      <div class="section-heading">
        <p class="eyebrow">dashboard / demo panel</p>
        <h2>See the raw input, the extracted JSON, and what changed.</h2>
        <p class="section-copy">
          The live workspace starts with runnable examples so visitors can compare the source and the output before they touch schema JSON.
        </p>
      </div>

      <div class="workspace panel">
        <div class="workspace-header">
          <div>
            <p class="workspace-kicker">Live workspace</p>
            <h3>Text Extract, URL Extract, and PDF Extract</h3>
          </div>
          <div class="workspace-badges">
            <span class="badge">Plain CSS</span>
            <span class="badge">TypeScript</span>
            <span class="badge">Responsive</span>
          </div>
        </div>

        <div class="tabs" role="tablist" aria-label="ExtractKit sections">
          <button class="tab-button is-active" type="button" role="tab" aria-selected="true" aria-controls="panel-text-extract" data-tab="text-extract">Text Extract</button>
          <button class="tab-button" type="button" role="tab" aria-selected="false" aria-controls="panel-url-extract" data-tab="url-extract">URL Extract</button>
          <button class="tab-button" type="button" role="tab" aria-selected="false" aria-controls="panel-pdf-extract" data-tab="pdf-extract">PDF Extract</button>
        </div>

        <div id="workspace-panels" class="panel-stack">
          ${renderTextExtractPanel()}
          ${renderUrlExtractPanel()}
          ${renderPdfExtractPanel()}
        </div>
      </div>
    </section>
  `;
}
