import { renderWorkspaceSection } from "../features/workspace/render";
import { renderApiExamplesSection } from "../sections/api-examples";
import { renderHeroSection } from "../sections/hero";
import { renderPricingSection } from "../sections/pricing";
import { renderUseCasesSection } from "../sections/use-cases";
import { renderHeader } from "./header";

// Renders the full static page shell before feature controllers bind behavior.
export function renderAppShell(): string {
  return `
    <div class="page">
      ${renderHeader()}
      <main class="layout">
        ${renderHeroSection()}
        ${renderWorkspaceSection()}
        ${renderApiExamplesSection()}
        ${renderUseCasesSection()}
        ${renderPricingSection()}
      </main>
    </div>
  `;
}
