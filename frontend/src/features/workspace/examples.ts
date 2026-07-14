import { TEXT_EXAMPLES, URL_EXAMPLES, PDF_EXAMPLES, type WorkspaceExample } from "../../config/defaults";
import { renderCustomSelect } from "../demand-capture/custom-select";

type ExampleKind = "text" | "url" | "pdf";

export function renderWorkspaceExamplePicker(options: {
  kind: ExampleKind;
  label: string;
  hint: string;
}): string {
  const examples = getExamples(options.kind);
  const selectId = `${options.kind}-example`;

  return `
    <div class="field field-full workspace-example-picker">
      ${renderCustomSelect({
        id: selectId,
        label: options.label,
        value: examples[0]?.id ?? "",
        options: examples.map((example) => ({
          label: example.label,
          value: example.id
        }))
      })}
      <p class="microcopy">${escapeHtml(options.hint)}</p>
    </div>
  `;
}

export function bindWorkspaceExamplePicker(options: {
  kind: ExampleKind;
  inputId: string;
  applyExample: (example: WorkspaceExample) => void;
}): () => void {
  const input = document.getElementById(options.inputId) as HTMLInputElement | null;

  if (!input) {
    return () => undefined;
  }

  const examples = getExamples(options.kind);
  const initialExample = examples.find((example) => example.id === input.value) ?? examples[0];

  if (initialExample) {
    options.applyExample(initialExample);
    input.value = initialExample.id;
  }

  const handleChange = () => {
    const selected = examples.find((example) => example.id === input.value) ?? examples[0];

    if (selected) {
      options.applyExample(selected);
    }
  };

  input.addEventListener("change", handleChange);

  return () => {
    input.removeEventListener("change", handleChange);
  };
}

function getExamples(kind: ExampleKind): WorkspaceExample[] {
  switch (kind) {
    case "text":
      return TEXT_EXAMPLES;
    case "url":
      return URL_EXAMPLES;
    case "pdf":
      return PDF_EXAMPLES;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
