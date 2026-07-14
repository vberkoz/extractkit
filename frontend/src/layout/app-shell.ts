import { renderWorkspaceSection } from "../features/workspace/render";
import { renderDemandCaptureSection } from "../features/demand-capture/render";
import { renderHeroSection } from "../sections/hero";
import { renderUseCasesSection } from "../sections/use-cases";
import { renderFooter } from "./footer";
import { renderHeader } from "./header";

// Renders the full static page shell before feature controllers bind behavior.
export function renderHomeShell(): string {
  return `
    <div class="page">
      ${renderHeader("home")}
      <main class="layout">
        ${renderHeroSection()}
        ${renderWorkspaceSection()}
        ${renderUseCasesSection()}
        ${renderDemandCaptureSection()}
      </main>
      ${renderFooter("home")}
    </div>
  `;
}
