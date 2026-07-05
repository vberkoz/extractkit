import { AppRoute } from "../lib/types";

export function renderHeader(route: AppRoute): string {
  return `
    <header class="topbar">
      <a class="brand" href="/#hero">
        <span class="brand-mark"></span>
        <span>ExtractKit</span>
      </a>
      <nav class="topnav" aria-label="Primary">
        <a href="/#demo">Demo</a>
        <a href="/#api">API</a>
        <a href="/#use-cases">Use cases</a>
        <a href="/#pricing">Pricing</a>
        <a href="/stats" ${route === "stats" ? 'aria-current="page"' : ""}>Stats</a>
      </nav>
    </header>
  `;
}
