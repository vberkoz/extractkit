import { API_BASE_URL, API_KEY_STORAGE_KEY } from "./config/runtime";
import { createApiClient } from "./lib/api";
import { getById } from "./lib/dom";
import { persistInputValue } from "./lib/storage";
import { initDocsFeature } from "./features/docs/controller";
import { initTextExtractFeature } from "./features/text-extract/controller";
import { initUrlExtractFeature } from "./features/url-extract/controller";
import { createUsageFeature } from "./features/usage/controller";
import { initWorkspaceTabs } from "./features/workspace/controller";
import { initApiExamplesSection } from "./sections/api-examples-controller";
import { renderAppShell } from "./layout/app-shell";

// Boots the static page shell, then wires interactive feature controllers.
const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

app.innerHTML = renderAppShell();

const apiKeyInput = getById<HTMLInputElement>("api-key");
persistInputValue(apiKeyInput, API_KEY_STORAGE_KEY);

const callApi = createApiClient({
  apiBaseUrl: API_BASE_URL,
  getApiKey: () => apiKeyInput.value
});

initTextExtractFeature(callApi);
initUrlExtractFeature(callApi);
initDocsFeature();
initApiExamplesSection();

const usageFeature = createUsageFeature(callApi);

initWorkspaceTabs({
  defaultTab: "text-extract",
  onTabActivated: (tabId) => {
    if (tabId === "usage") {
      usageFeature.loadIfNeeded();
    }
  }
});
