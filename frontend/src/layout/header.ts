import { AppRoute } from "../lib/types";

export function renderHeader(route: AppRoute): string {
  return `
    <header class="topbar">
      <a class="brand" href="/">
        <span class="brand-mark"></span>
        <span>ExtractKit</span>
      </a>
      <nav class="topnav" aria-label="Primary">
        <a href="/#demo">Demo</a>
        <a href="/#use-cases">Use cases</a>
      </nav>
    </header>
  `;
}
