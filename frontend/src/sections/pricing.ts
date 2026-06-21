export function renderPricingSection(): string {
  return `
    <section id="pricing" class="section-stack">
      <div class="panel pricing-panel">
        <div class="section-heading">
          <p class="eyebrow">pricing placeholder</p>
          <h2>Simple usage-based packaging</h2>
          <p class="section-copy">
            Replace this section with real pricing later. The structure is here now so the frontend reads like a product site instead of a raw utility page.
          </p>
        </div>
        <div class="cards-grid pricing-grid">
          <article class="price-card">
            <span class="price-tier">Starter</span>
            <strong class="price-value">$0</strong>
            <p>Testing, local schemas, and first integration pass.</p>
          </article>
          <article class="price-card price-card-featured">
            <span class="price-tier">Growth</span>
            <strong class="price-value">TBD</strong>
            <p>Higher request volume, usage visibility, and production workflows.</p>
          </article>
          <article class="price-card">
            <span class="price-tier">Enterprise</span>
            <strong class="price-value">Custom</strong>
            <p>Shared limits, tailored support, and room for private deployment needs.</p>
          </article>
        </div>
      </div>
    </section>
  `;
}
