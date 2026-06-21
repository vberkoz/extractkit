export function renderHeader(): string {
  return `
    <header class="topbar">
      <a class="brand" href="#hero">
        <span class="brand-mark"></span>
        <span>ExtractKit</span>
      </a>
      <nav class="topnav" aria-label="Primary">
        <a href="#demo">Demo</a>
        <a href="#api">API</a>
        <a href="#use-cases">Use cases</a>
        <a href="#pricing">Pricing</a>
      </nav>
    </header>
  `;
}
