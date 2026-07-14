export function renderUseCasesSection(): string {
  return `
    <section id="use-cases" class="section-stack">
      <div class="section-heading">
        <p class="eyebrow">use cases</p>
        <h2>See if your extraction problem is a fit</h2>
        <p class="section-copy">
          If your team already has messy input, repetitive cleanup, and a clear destination format, this is probably worth trying.
        </p>
      </div>
      <div class="cards-grid use-case-grid">
        <article class="panel info-card use-case-card">
          <p class="use-case-kicker">For ops, support, and RevOps teams</p>
          <h3>Lead capture cleanup</h3>
          <p class="use-case-problem">You already get inbound notes, emails, or form text that need manual normalization before anyone can act on them.</p>
          <p class="use-case-data"><strong>Data types:</strong> text, emails, CRM notes, pasted records</p>
          <p class="use-case-next"><strong>Next:</strong> test a sample text extraction and see if the field shape matches your workflow.</p>
        </article>
        <article class="panel info-card use-case-card">
          <p class="use-case-kicker">For content, growth, and research teams</p>
          <h3>Article metadata parsing</h3>
          <p class="use-case-problem">You need titles, summaries, dates, or labels from live pages, but hand-parsing every URL is too slow.</p>
          <p class="use-case-data"><strong>Data types:</strong> URLs, article pages, docs, blog posts</p>
          <p class="use-case-next"><strong>Next:</strong> run the URL demo on a page you already know is representative.</p>
        </article>
        <article class="panel info-card use-case-card">
          <p class="use-case-kicker">For product, support, and automation builders</p>
          <h3>Internal tooling</h3>
          <p class="use-case-problem">You have a repeatable extraction step, but you’re not sure if the schema is stable enough to ship or if the format is too messy.</p>
          <p class="use-case-data"><strong>Data types:</strong> PDFs, tickets, reports, pasted documents</p>
          <p class="use-case-next"><strong>Next:</strong> try the PDF demo and compare the raw source with the extracted JSON.</p>
        </article>
      </div>
    </section>
  `;
}
