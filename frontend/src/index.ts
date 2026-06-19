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
  <div class="page">
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

    <main class="layout">
      <section id="hero" class="hero section-grid">
        <div class="hero-copy panel panel-hero">
          <p class="eyebrow">structured extraction for developer teams</p>
          <h1>Ship extraction flows with a clean, inspectable client.</h1>
          <p class="lead">
            Test text extraction, fetch-and-extract from a URL, inspect usage, and copy request examples from one lightweight interface.
          </p>
          <div class="hero-actions">
            <a class="button button-primary" href="#demo">Open live demo</a>
            <a class="button button-secondary" href="#api">View API examples</a>
          </div>
          <label class="field field-inline">
            <span class="field-label">API key</span>
            <input id="api-key" class="text-input" type="password" placeholder="Paste your ExtractKit API key" autocomplete="off" />
          </label>
          <p class="microcopy">
            Stored locally via <code>localStorage</code>. Live requests send <code>Authorization: Bearer ...</code>.
          </p>
        </div>

        <aside class="hero-panel panel panel-dark" aria-label="Dashboard preview">
          <div class="terminal-window">
            <div class="terminal-bar">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="terminal-body">
              <p>$ extractkit run profile.schema.json input.txt</p>
              <p class="terminal-dim">status: success</p>
              <p>{</p>
              <p>  "name": "Jane Doe",</p>
              <p>  "email": "jane@example.com",</p>
              <p>  "company": "ExtractKit"</p>
              <p>}</p>
            </div>
          </div>
          <div class="dashboard-grid">
            <article class="mini-stat">
              <span class="mini-label">Latency</span>
              <strong>240ms</strong>
            </article>
            <article class="mini-stat">
              <span class="mini-label">Success</span>
              <strong>99.9%</strong>
            </article>
            <article class="mini-stat">
              <span class="mini-label">Schema fields</span>
              <strong>12</strong>
            </article>
            <article class="mini-stat">
              <span class="mini-label">Requests today</span>
              <strong>1,284</strong>
            </article>
          </div>
        </aside>
      </section>

      <section id="demo" class="section-stack">
        <div class="section-heading">
          <p class="eyebrow">dashboard / demo panel</p>
          <h2>Run the product from the page</h2>
          <p class="section-copy">
            The live workspace keeps the real extraction tools intact while fitting into a cleaner product-facing layout.
          </p>
        </div>

        <div class="workspace panel">
          <div class="workspace-header">
            <div>
              <p class="workspace-kicker">Live workspace</p>
              <h3>Text, URL, usage, and docs</h3>
            </div>
            <div class="workspace-badges">
              <span class="badge">Plain CSS</span>
              <span class="badge">TypeScript</span>
              <span class="badge">Responsive</span>
            </div>
          </div>

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
                <button id="extract-text" class="button button-primary" type="button">Extract</button>
                <p id="text-status" class="status" aria-live="polite"></p>
              </div>
              <div class="result-block">
                <div class="result-header">
                  <h3>Result JSON</h3>
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
                <button id="extract-url" class="button button-primary" type="button">Extract URL</button>
                <p id="url-status" class="status" aria-live="polite"></p>
              </div>
              <div class="result-block">
                <div class="result-header">
                  <h3>Result JSON</h3>
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
                  <button id="refresh-usage" class="button button-secondary" type="button">Refresh Usage</button>
                  <p id="usage-status" class="status" aria-live="polite"></p>
                </div>
                <p class="microcopy">This view calls <code>GET /v1/usage</code> against <code>${API_BASE_URL}</code>.</p>
              </div>
            </section>

            <section class="tab-panel" data-panel="docs" hidden>
              <div class="docs-grid">
                <article class="doc-card">
                  <h3><code>POST /v1/extract</code></h3>
                  <pre class="result-viewer code-block" id="docs-extract"></pre>
                </article>
                <article class="doc-card">
                  <h3><code>POST /v1/extract-url</code></h3>
                  <pre class="result-viewer code-block" id="docs-extract-url"></pre>
                </article>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section id="api" class="section-stack">
        <div class="section-heading">
          <p class="eyebrow">example api</p>
          <h2>Request and response at a glance</h2>
        </div>

        <div class="api-grid">
          <article class="panel code-panel">
            <div class="panel-heading">
              <p class="workspace-kicker">Example API request</p>
              <h3><code>POST /v1/extract</code></h3>
            </div>
            <pre id="example-request" class="result-viewer code-block"></pre>
          </article>

          <article class="panel code-panel">
            <div class="panel-heading">
              <p class="workspace-kicker">Example response</p>
              <h3><code>200 OK</code></h3>
            </div>
            <pre id="example-response" class="result-viewer code-block"></pre>
          </article>
        </div>
      </section>

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
    </main>
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
const exampleRequest = getById<HTMLElement>("example-request");
const exampleResponse = getById<HTMLElement>("example-response");

apiKeyInput.value = localStorage.getItem(API_KEY_STORAGE_KEY) ?? "";
textSchemaInput.value = DEFAULT_TEXT_SCHEMA;
urlSchemaInput.value = DEFAULT_URL_SCHEMA;

const exampleRequestBody = {
  content: "name: Jane Doe\\nemail: jane@example.com\\ncompany: ExtractKit",
  schema: {
    name: "string",
    email: "email",
    company: "string"
  }
};

docsExtract.textContent = buildCurlExample("/v1/extract", exampleRequestBody);
docsExtractUrl.textContent = buildCurlExample("/v1/extract-url", {
  url: "https://example.com/article",
  schema: {
    title: "string",
    summary: "string",
    publishedAt: "date"
  }
});
exampleRequest.textContent = buildCurlExample("/v1/extract", exampleRequestBody);
exampleResponse.textContent = JSON.stringify(
  {
    ok: true,
    data: {
      name: "Jane Doe",
      email: "jane@example.com",
      company: "ExtractKit"
    }
  },
  null,
  2
);

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
    options.button.textContent =
      options.button.id === "extract-url" ? "Extract URL" : "Extract";
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
    throw new Error(
      payload.ok
        ? `Request failed with status ${response.status}.`
        : `${payload.error.message}${fieldMessages}`
    );
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
