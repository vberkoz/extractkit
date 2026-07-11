import { AppRoute, TabId } from "./types";

export function getRouteFromLocation(pathname: string): AppRoute {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === "/stats") {
    return "stats";
  }

  return "home";
}

export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function scrollToAnchoredSectionIfNeeded(hash: string): void {
  const normalizedHash = hash.replace(/^#/, "");

  if (!normalizedHash) {
    return;
  }

  if (isWorkspaceTabId(normalizedHash)) {
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-panel="${normalizedHash}"]`)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    return;
  }

  window.requestAnimationFrame(() => {
    document.getElementById(normalizedHash)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

function isWorkspaceTabId(value: string): value is TabId {
  return value === "text-extract" || value === "url-extract" || value === "pdf-extract";
}
