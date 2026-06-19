const API_BASE_URL = "https://extractkit-api.vberkoz.com";
const API_KEY_STORAGE_KEY = "extractkit.apiKey";
const DEFAULT_TEXT_SCHEMA = JSON.stringify(
  {
    name: "string",
    email: "email",
    company: "string"
  },
  null,
  2
);
const DEFAULT_URL_SCHEMA = JSON.stringify(
  {
    title: "string",
    summary: "string",
    publishedAt: "date"
  },
  null,
  2
);

type TabId = "text-extract" | "url-extract" | "usage" | "docs";

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiError = {
  ok: false;
  error: {
    message: string;
    code: string;
    fields?: Record<string, string[]>;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiError;

type UsageData = {
  used: number;
  limit: number;
  plan: string;
  month: string;
};

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

app.innerHTML = `
  <div class="layout">
    <section class="hero card">
      <p class="eyebrow">ExtractKit</p>
      <h1>Minimal extraction client</h1>
      <p class="lead">
        Try text extraction, fetch-and-extract from a URL, inspect your usage, and copy API examples without leaving the page.
      </p>
      <label class="field">
        <span class="field-label">API Key</span>
        <input id="api-key" class="text-input" type="password" placeholder="Paste your ExtractKit API key" autocomplete="off" />
      </label>
      <p class="hint">Stored locally in your browser via <code>localStorage</code>. Requests use <code>Authorization: Bearer ...</code>.</p>
    </section>

    <section class="card tabs-shell">
      <div class="tabs" role="tablist" aria-label="ExtractKit sections">
        <button class="tab-button is-active" type="button" role="tab" aria-selected="true" data-tab="text-extract">Text Extract</button>
        <button class="tab-button" type="button" role="tab" aria-selected="false" data-tab="url-extract">URL Extract</button>
        <button class="tab-button" type="button" role="tab" aria-selected="false" data-tab="usage">Usage</button>
        <button class="tab-button" type="button" role="tab" aria-selected="false" data-tab="docs">Docs</button>
      </div>

      <div class="panel-stack">
        <section class="tab-panel is-active" data-panel="text-extract">
          <div class="panel-grid">
            <label class="field">
              <span class="field-label">Content</span>
              <textarea id="text-content" class="textarea" rows="12" placeholder="name: Jane Doe&#10;email: jane@example.com&#10;company: ExtractKit"></textarea>
            </label>
            <label class="field">
              <span class="field-label">Schema JSON</span>
              <textarea id="text-schema" class="textarea code-input" rows="12"></textarea>
            </label>
          </div>
          <div class="actions">
            <button id="extract-text" class="action-button" type="button">Extract</button>
            <p id="text-status" class="status" aria-live="polite"></p>
          </div>
          <div class="result-block">
            <div class="result-header">
              <h2>Result JSON</h2>
            </div>
            <pre id="text-result" class="result-viewer">Run a text extraction to see the response.</pre>
          </div>
        </section>

        <section class="tab-panel" data-panel="url-extract" hidden>
          <div class="panel-grid">
            <label class="field field-full">
              <span class="field-label">URL</span>
              <input id="url-input" class="text-input" type="url" placeholder="https://example.com/article" />
            </label>
            <label class="field">
              <span class="field-label">Schema JSON</span>
              <textarea id="url-schema" class="textarea code-input" rows="12"></textarea>
            </label>
          </div>
          <div class="actions">
            <button id="extract-url" class="action-button" type="button">Extract URL</button>
            <p id="url-status" class="status" aria-live="polite"></p>
          </div>
          <div class="result-block">
            <div class="result-header">
              <h2>Result JSON</h2>
            </div>
            <pre id="url-result" class="result-viewer">Run a URL extraction to see the response.</pre>
          </div>
        </section>

        <section class="tab-panel" data-panel="usage" hidden>
          <div class="usage-card">
            <div class="usage-metrics">
              <article class="metric">
                <span class="metric-label">Used</span>
                <strong id="usage-used">-</strong>
              </article>
              <article class="metric">
                <span class="metric-label">Limit</span>
                <strong id="usage-limit">-</strong>
              </article>
              <article class="metric">
                <span class="metric-label">Plan</span>
                <strong id="usage-plan">-</strong>
              </article>
            </div>
            <div class="actions">
              <button id="refresh-usage" class="action-button secondary-button" type="button">Refresh Usage</button>
              <p id="usage-status" class="status" aria-live="polite"></p>
            </div>
            <p class="hint">This tab calls <code>GET /v1/usage</code> against <code>${API_BASE_URL}</code>.</p>
          </div>
        </section>

        <section class="tab-panel" data-panel="docs" hidden>
          <div class="docs-grid">
            <article class="doc-card">
              <h2><code>POST /v1/extract</code></h2>
              <pre class="result-viewer code-block" id="docs-extract"></pre>
            </article>
            <article class="doc-card">
              <h2><code>POST /v1/extract-url</code></h2>
              <pre class="result-viewer code-block" id="docs-extract-url"></pre>
            </article>
          </div>
        </section>
      </div>
    </section>
  </div>
`;

const apiKeyInput = getById<HTMLInputElement>("api-key");
const textContentInput = getById<HTMLTextAreaElement>("text-content");
const textSchemaInput = getById<HTMLTextAreaElement>("text-schema");
const textStatus = getById<HTMLElement>("text-status");
const textResult = getById<HTMLElement>("text-result");
const textExtractButton = getById<HTMLButtonElement>("extract-text");
const urlInput = getById<HTMLInputElement>("url-input");
const urlSchemaInput = getById<HTMLTextAreaElement>("url-schema");
const urlStatus = getById<HTMLElement>("url-status");
const urlResult = getById<HTMLElement>("url-result");
const urlExtractButton = getById<HTMLButtonElement>("extract-url");
const usageUsed = getById<HTMLElement>("usage-used");
const usageLimit = getById<HTMLElement>("usage-limit");
const usagePlan = getById<HTMLElement>("usage-plan");
const usageStatus = getById<HTMLElement>("usage-status");
const refreshUsageButton = getById<HTMLButtonElement>("refresh-usage");
const docsExtract = getById<HTMLElement>("docs-extract");
const docsExtractUrl = getById<HTMLElement>("docs-extract-url");

apiKeyInput.value = localStorage.getItem(API_KEY_STORAGE_KEY) ?? "";
textSchemaInput.value = DEFAULT_TEXT_SCHEMA;
urlSchemaInput.value = DEFAULT_URL_SCHEMA;
docsExtract.textContent = buildCurlExample("/v1/extract", {
  content: "name: Jane Doe\\nemail: jane@example.com\\ncompany: ExtractKit",
  schema: {
    name: "string",
    email: "email",
    company: "string"
  }
});
docsExtractUrl.textContent = buildCurlExample("/v1/extract-url", {
  url: "https://example.com/article",
  schema: {
    title: "string",
    summary: "string",
    publishedAt: "date"
  }
});

apiKeyInput.addEventListener("input", () => {
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKeyInput.value.trim());
});

textExtractButton.addEventListener("click", async () => {
  const schema = parseSchema(textSchemaInput.value);

  if (!schema.ok) {
    setStatus(textStatus, schema.message, "error");
    return;
  }

  await runAction({
    button: textExtractButton,
    statusEl: textStatus,
    resultEl: textResult,
    idleMessage: "Run a text extraction to see the response.",
    pendingMessage: "Extracting text...",
    successMessage: "Text extraction complete.",
    request: () =>
      callApi("/v1/extract", {
        method: "POST",
        body: {
          content: textContentInput.value,
          schema: schema.value
        }
      })
  });
});

urlExtractButton.addEventListener("click", async () => {
  const schema = parseSchema(urlSchemaInput.value);

  if (!schema.ok) {
    setStatus(urlStatus, schema.message, "error");
    return;
  }

  await runAction({
    button: urlExtractButton,
    statusEl: urlStatus,
    resultEl: urlResult,
    idleMessage: "Run a URL extraction to see the response.",
    pendingMessage: "Fetching and extracting URL...",
    successMessage: "URL extraction complete.",
    request: () =>
      callApi("/v1/extract-url", {
        method: "POST",
        body: {
          url: urlInput.value,
          schema: schema.value
        }
      })
  });
});

refreshUsageButton.addEventListener("click", async () => {
  await loadUsage();
});

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-tab]")) {
  button.addEventListener("click", () => {
    activateTab(button.dataset.tab as TabId);
  });
}

activateTab("text-extract");

async function loadUsage(): Promise<void> {
  await runPendingState(refreshUsageButton, usageStatus, "Loading usage...");

  try {
    const response = await callApi<UsageData>("/v1/usage", {
      method: "GET"
    });

    usageUsed.textContent = String(response.used);
    usageLimit.textContent = String(response.limit);
    usagePlan.textContent = response.plan;
    setStatus(usageStatus, `Usage loaded for ${response.month}.`, "success");
  } catch (error) {
    usageUsed.textContent = "-";
    usageLimit.textContent = "-";
    usagePlan.textContent = "-";
    setStatus(usageStatus, getErrorMessage(error), "error");
  } finally {
    refreshUsageButton.disabled = false;
    refreshUsageButton.textContent = "Refresh Usage";
  }
}

function activateTab(tabId: TabId): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-tab]")) {
    const active = button.dataset.tab === tabId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  }

  for (const panel of document.querySelectorAll<HTMLElement>("[data-panel]")) {
    const active = panel.dataset.panel === tabId;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  }

  if (tabId === "usage" && usageUsed.textContent === "-") {
    void loadUsage();
  }
}

async function runAction(options: {
  button: HTMLButtonElement;
  statusEl: HTMLElement;
  resultEl: HTMLElement;
  idleMessage: string;
  pendingMessage: string;
  successMessage: string;
  request: () => Promise<unknown>;
}): Promise<void> {
  await runPendingState(options.button, options.statusEl, options.pendingMessage);

  try {
    const response = await options.request();
    options.resultEl.textContent = JSON.stringify(response, null, 2);
    setStatus(options.statusEl, options.successMessage, "success");
  } catch (error) {
    options.resultEl.textContent = JSON.stringify(
      {
        error: getErrorMessage(error)
      },
      null,
      2
    );
    setStatus(options.statusEl, getErrorMessage(error), "error");
  } finally {
    options.button.disabled = false;
    options.button.textContent = options.button.id === "extract-url" ? "Extract URL" : "Extract";
    if (options.resultEl.textContent?.trim() === "") {
      options.resultEl.textContent = options.idleMessage;
    }
  }
}

async function runPendingState(
  button: HTMLButtonElement,
  statusEl: HTMLElement,
  pendingMessage: string
): Promise<void> {
  button.disabled = true;
  button.textContent = "Working...";
  setStatus(statusEl, pendingMessage, "pending");
}

async function callApi<T>(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  }
): Promise<T> {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    throw new Error("Add an API key first.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: init.method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: init.body ? JSON.stringify(init.body) : undefined
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.ok) {
    const fieldMessages = payload.ok
      ? ""
      : payload.error.fields
        ? ` ${JSON.stringify(payload.error.fields)}`
        : "";
    throw new Error(payload.ok ? `Request failed with status ${response.status}.` : `${payload.error.message}${fieldMessages}`);
  }

  return payload.data;
}

function parseSchema(rawValue: string):
  | { ok: true; value: Record<string, string> }
  | { ok: false; message: string } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return {
      ok: false,
      message: "Schema must be valid JSON."
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      message: "Schema must be a JSON object."
    };
  }

  return {
    ok: true,
    value: parsed as Record<string, string>
  };
}

function setStatus(
  element: HTMLElement,
  message: string,
  state: "pending" | "success" | "error"
): void {
  element.textContent = message;
  element.dataset.state = state;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function buildCurlExample(path: string, body: Record<string, unknown>): string {
  return `curl -X POST "${API_BASE_URL}${path}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body, null, 2)}'`;
}

function getById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }

  return element as T;
}
