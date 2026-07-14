import { renderCustomSelect } from "./custom-select";

export function renderDemandCaptureSection(): string {
  return `
    <section class="section-stack demand-section">
      <article id="demand-capture" class="panel demand-capture">
        <div class="panel-heading">
          <p class="workspace-kicker">demand capture</p>
          <h3>Tell us what you’re trying to extract</h3>
          <p class="section-copy">
            No account needed. Share the shape of the problem and we’ll use it to judge whether this workflow is worth building out.
          </p>
        </div>

        <form id="demand-capture-form" class="demand-capture-form">
          <label class="field field-full">
            <span class="field-label">What are you trying to extract?</span>
            <textarea
              id="demand-need"
              class="textarea"
              rows="3"
              required
              placeholder="Invoices from email attachments, lead details from PDFs, article metadata from URLs..."
            ></textarea>
          </label>

          <div class="panel-grid">
            <div class="field">
              ${renderCustomSelect({
                id: "demand-source-format",
                label: "What format is the source?",
                value: "text",
                options: [
                  { label: "Text", value: "text" },
                  { label: "URL", value: "url" },
                  { label: "PDF", value: "pdf" },
                  { label: "Mixed", value: "mixed" },
                  { label: "Other", value: "other" }
                ]
              })}
            </div>

            <div class="field">
              ${renderCustomSelect({
                id: "demand-frequency",
                label: "How often do you need it?",
                value: "one-time",
                options: [
                  { label: "One time", value: "one-time" },
                  { label: "Weekly", value: "weekly" },
                  { label: "Monthly", value: "monthly" },
                  { label: "Daily", value: "daily" },
                  { label: "Ad hoc", value: "ad-hoc" }
                ]
              })}
            </div>
          </div>

          <div class="panel-grid">
            <label class="field field-full">
              <span class="field-label">Optional follow-up email</span>
              <input
                id="demand-contact-email"
                class="text-input"
                type="email"
                placeholder="name@company.com"
              />
            </label>
          </div>

          <div class="actions demand-capture-actions">
            <button id="demand-capture-submit" class="button button-primary" type="submit">Send demand signal</button>
            <p id="demand-capture-status" class="status" aria-live="polite"></p>
          </div>
        </form>
      </article>
    </section>
  `;
}

export function renderDemandFollowupPrompt(): string {
  return `
    <div class="demand-followup" data-demand-followup hidden>
      <div>
        <p class="workspace-kicker">demand capture</p>
        <h4>Want us to shape this around your use case?</h4>
        <p class="hint">Tell us what you’re trying to extract and we’ll use it to validate demand.</p>
      </div>
      <a class="button button-secondary" href="#demand-capture">Tell us what you’re trying to extract</a>
    </div>
  `;
}
