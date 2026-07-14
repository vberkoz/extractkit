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
      scrollElementWithOffset(
        document.querySelector<HTMLElement>(`[data-panel="${normalizedHash}"]`),
        24
      );
    });

    return;
  }

  window.requestAnimationFrame(() => {
    scrollElementWithOffset(document.getElementById(normalizedHash), 24);
  });
}

function isWorkspaceTabId(value: string): value is TabId {
  return value === "text-extract" || value === "url-extract" || value === "pdf-extract";
}

export function scrollElementWithOffset(element: HTMLElement | null, offset: number): void {
  if (!element) {
    return;
  }

  const top = window.scrollY + element.getBoundingClientRect().top - offset;

  window.scrollTo({
    behavior: "smooth",
    top: Math.max(0, top)
  });
}
