import { renderHeader } from "./header";
import { renderStatsSection } from "../sections/stats";
import { renderFooter } from "./footer";

export function renderStatsShell(): string {
  return `
    <div class="page">
      ${renderHeader("stats")}
      ${renderStatsSection()}
      ${renderFooter("stats")}
    </div>
  `;
}
