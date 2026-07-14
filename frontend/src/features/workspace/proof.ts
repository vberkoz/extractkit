type ProofInputElement = HTMLInputElement | HTMLTextAreaElement;

export function renderWorkspaceProofBlock(options: {
  rawLabel: string;
  rawPreviewId: string;
  rawPlaceholder: string;
  resultLabel: string;
  resultId: string;
  resultPlaceholder: string;
  changeSummary: string;
  whyItMatters: string;
}): string {
  return `
    <div class="proof-block">
      <div class="proof-heading">
        <p class="proof-kicker">Before / after proof</p>
        <h4>See the input and the extracted result side by side.</h4>
        <p class="proof-copy">${escapeHtml(options.changeSummary)} ${escapeHtml(options.whyItMatters)}</p>
      </div>

      <div class="proof-grid">
        <section class="proof-pane">
          <p class="proof-label">${escapeHtml(options.rawLabel)}</p>
          <pre id="${options.rawPreviewId}" class="proof-viewer">${escapeHtml(options.rawPlaceholder)}</pre>
        </section>

        <section class="proof-pane proof-pane-result">
          <p class="proof-label">${escapeHtml(options.resultLabel)}</p>
          <pre id="${options.resultId}" class="proof-viewer proof-viewer-result">${escapeHtml(options.resultPlaceholder)}</pre>
        </section>
      </div>
    </div>
  `;
}

export function bindWorkspaceProofSnapshot(options: {
  input: ProofInputElement;
  preview: HTMLElement;
  placeholder: string;
}): () => void {
  const sync = () => {
    const value = options.input.value.trim();
    options.preview.textContent = value.length ? options.input.value : options.placeholder;
  };

  options.input.addEventListener("input", sync);
  sync();

  return () => {
    options.input.removeEventListener("input", sync);
  };
}

export function syncWorkspaceProofSnapshot(
  input: ProofInputElement,
  preview: HTMLElement,
  placeholder: string
): void {
  const value = input.value.trim();
  preview.textContent = value.length ? input.value : placeholder;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
