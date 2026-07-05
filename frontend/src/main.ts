import { API_BASE_URL, API_KEY_STORAGE_KEY } from "./config/runtime";
import { createApiClient } from "./lib/api";
import { getById } from "./lib/dom";
import { AppRoute } from "./lib/types";
import { persistInputValue } from "./lib/storage";
import { initDocsFeature } from "./features/docs/controller";
import { initPdfExtractFeature } from "./features/pdf-extract/controller";
import { initTextExtractFeature } from "./features/text-extract/controller";
import { initUrlExtractFeature } from "./features/url-extract/controller";
import { createUsageFeature } from "./features/usage/controller";
import { initWorkspaceTabs } from "./features/workspace/controller";
import { initApiExamplesSection } from "./sections/api-examples-controller";
import { renderHomeShell } from "./layout/app-shell";
import { renderStatsShell } from "./layout/stats-shell";

// Boots the static page shell, then wires interactive feature controllers.
const appRoot = (() => {
  const element = document.querySelector<HTMLElement>("#app");

  if (!element) {
    throw new Error("App root not found.");
  }

  return element;
})();

let cleanupCurrentRoute: (() => void) | null = null;

window.addEventListener("popstate", () => {
  renderCurrentRoute();
});

document.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const link = target.closest<HTMLAnchorElement>("a[href]");

  if (!link) {
    return;
  }

  if (link.target && link.target !== "_self") {
    return;
  }

  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const nextUrl = new URL(link.href);
  const currentUrl = new URL(window.location.href);

  if (nextUrl.origin !== currentUrl.origin) {
    return;
  }

  if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) {
    if (!nextUrl.hash) {
      event.preventDefault();
    }

    return;
  }

  event.preventDefault();
  window.history.pushState(null, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  renderCurrentRoute();
});

renderCurrentRoute();

function renderCurrentRoute(): void {
  cleanupCurrentRoute?.();
  cleanupCurrentRoute = null;

  const route = getRouteFromLocation();

  if (route === "stats") {
    renderRouteShell(route);
    updateDocumentMetadata(route);
    return;
  }

  renderRouteShell(route);
  updateDocumentMetadata(route);
  cleanupCurrentRoute = mountHomeRoute();
  scrollToAnchoredSectionIfNeeded();
}

function renderRouteShell(route: AppRoute): void {
  appRoot.innerHTML = route === "stats" ? renderStatsShell() : renderHomeShell();
}

function mountHomeRoute(): () => void {
  const apiKeyInput = getById<HTMLInputElement>("api-key");
  persistInputValue(apiKeyInput, API_KEY_STORAGE_KEY);

  const callApi = createApiClient({
    apiBaseUrl: API_BASE_URL,
    getApiKey: () => apiKeyInput.value
  });

  initTextExtractFeature(callApi);
  initUrlExtractFeature(callApi);
  initPdfExtractFeature(callApi);
  initDocsFeature();
  initApiExamplesSection();

  const usageFeature = createUsageFeature(callApi);

  return initWorkspaceTabs({
    defaultTab: "text-extract",
    onTabActivated: (tabId) => {
      if (tabId === "usage") {
        usageFeature.loadIfNeeded();
      }
    }
  });
}

function getRouteFromLocation(): AppRoute {
  const pathname = normalizePathname(window.location.pathname);

  if (pathname === "/stats") {
    return "stats";
  }

  return "home";
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function updateDocumentMetadata(route: AppRoute): void {
  const metadata = route === "stats"
    ? {
        title: "ExtractKit Stats",
        description: "View analytics, operational health, and request mix for ExtractKit."
      }
    : {
        title: "ExtractKit",
        description: "Structured extraction for developer teams with a clean demo workspace."
      };

  document.title = metadata.title;
  updateMetaTag('meta[name="description"]', metadata.description);
  updateMetaTag('meta[property="og:title"]', metadata.title);
  updateMetaTag('meta[property="og:description"]', metadata.description);
}

function updateMetaTag(selector: string, content: string): void {
  const meta = document.querySelector<HTMLMetaElement>(selector);

  if (meta) {
    meta.content = content;
    return;
  }

  const nextMeta = document.createElement("meta");

  if (selector.includes('name="')) {
    nextMeta.setAttribute("name", selector.match(/name="([^"]+)"/)?.[1] ?? "");
  }

  if (selector.includes('property="')) {
    nextMeta.setAttribute("property", selector.match(/property="([^"]+)"/)?.[1] ?? "");
  }

  nextMeta.content = content;
  document.head.appendChild(nextMeta);
}

function scrollToAnchoredSectionIfNeeded(): void {
  const hash = window.location.hash.replace(/^#/, "");

  if (!hash) {
    return;
  }

  if (hash === "text-extract" || hash === "url-extract" || hash === "pdf-extract" || hash === "usage" || hash === "docs") {
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-panel="${hash}"]`)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    return;
  }

  window.requestAnimationFrame(() => {
    document.getElementById(hash)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}
