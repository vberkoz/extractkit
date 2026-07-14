import type { AppRoute } from "../lib/types";

export function renderFooter(route: AppRoute): string {
  return `
    <footer class="footer">
      <p class="footer-copy">Built to validate extraction demand before teams invest engineering time.</p>
      <nav class="footer-links" aria-label="Footer">
        <a href="/#demo">Demo</a>
        <a href="/#use-cases">Use cases</a>
        <a href="/stats" ${route === "stats" ? 'aria-current="page"' : ""}>Stats</a>
      </nav>
    </footer>
  `;
}
