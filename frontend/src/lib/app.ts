import { API_BASE_URL } from "../config/runtime";
import { createApiClient } from "./api";
import { AppRoute } from "./types";
import { initPdfExtractFeature } from "../features/pdf-extract/controller";
import { initDemandCaptureFeature } from "../features/demand-capture/controller";
import { initStatsFeature } from "../features/stats/controller";
import { initTextExtractFeature } from "../features/text-extract/controller";
import { initUrlExtractFeature } from "../features/url-extract/controller";
import { initWorkspaceTabs } from "../features/workspace/controller";
import { renderHomeShell } from "../layout/app-shell";
import { renderStatsShell } from "../layout/stats-shell";
import { ensureApiKey } from "./api-key";
import { updateDocumentMetadata } from "./metadata";
import { getRouteFromLocation, scrollToAnchoredSectionIfNeeded } from "./router";
import { trackIntentEvent } from "./telemetry";

export function startApp(): void {
  const appRoot = getAppRoot();
  let cleanupCurrentRoute: (() => void) | null = null;

  window.addEventListener("popstate", () => {
    void renderCurrentRoute();
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

    if (link.dataset.intentEvent) {
      void trackIntentEvent({
        eventType: link.dataset.intentEvent as "hero_cta_click",
        surface: (link.dataset.intentSurface as "hero") ?? "hero"
      });
    }

    if (link.classList.contains("brand")) {
      event.preventDefault();

      if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) {
        window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}`);
        window.scrollTo({
          behavior: "smooth",
          top: 0
        });
        return;
      }

      window.history.pushState(null, "", `${nextUrl.pathname}${nextUrl.search}`);
      void renderCurrentRoute();
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
    void renderCurrentRoute();
  });

  void renderCurrentRoute();

  async function renderCurrentRoute(): Promise<void> {
    cleanupCurrentRoute?.();
    cleanupCurrentRoute = null;

    const route = getRouteFromLocation(window.location.pathname);

    if (route === "stats") {
      renderRouteShell(appRoot, route);
      updateDocumentMetadata(route);
      initStatsFeature();
      return;
    }

    renderRouteShell(appRoot, route);
    updateDocumentMetadata(route);
    cleanupCurrentRoute = await mountHomeRoute();
    scrollToAnchoredSectionIfNeeded(window.location.hash);
  }
}

function getAppRoot(): HTMLElement {
  const element = document.querySelector<HTMLElement>("#app");

  if (!element) {
    throw new Error("App root not found.");
  }

  return element;
}

function renderRouteShell(appRoot: HTMLElement, route: AppRoute): void {
  appRoot.innerHTML = route === "stats" ? renderStatsShell() : renderHomeShell();
}

async function mountHomeRoute(): Promise<() => void> {
  const cleanupDemandCapture = initDemandCaptureFeature();
  const apiKey = await ensureApiKey(API_BASE_URL);

  const callApi = createApiClient({
    apiBaseUrl: API_BASE_URL,
    getApiKey: () => apiKey
  });

  initTextExtractFeature(callApi);
  initUrlExtractFeature(callApi);
  initPdfExtractFeature(callApi);

  const cleanupWorkspaceTabs = initWorkspaceTabs({
    defaultTab: "text-extract"
  });

  return () => {
    cleanupDemandCapture();
    cleanupWorkspaceTabs();
  };
}
