export function renderUseCasesSection(): string {
  return `
    <section id="use-cases" class="section-stack">
      <div class="section-heading">
        <p class="eyebrow">use cases</p>
        <h2>Fits the common extraction loops</h2>
      </div>
      <div class="cards-grid">
        <article class="panel info-card">
          <h3>Lead capture cleanup</h3>
          <p>Turn freeform inbound text into normalized CRM fields without building a heavyweight back office first.</p>
        </article>
        <article class="panel info-card">
          <h3>Article metadata parsing</h3>
          <p>Fetch URLs, strip noise, and shape summaries, dates, or titles into a consistent downstream payload.</p>
        </article>
        <article class="panel info-card">
          <h3>Internal tooling</h3>
          <p>Give ops or support teams a minimal interface for trying schemas before wiring them into production jobs.</p>
        </article>
      </div>
    </section>
  `;
}
