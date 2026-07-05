import { renderHeader } from "./header";
import { renderStatsSection } from "../sections/stats";

export function renderStatsShell(): string {
  return `
    <div class="page">
      ${renderHeader("stats")}
      ${renderStatsSection()}
    </div>
  `;
}
