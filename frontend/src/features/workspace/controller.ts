import { TabId } from "../../lib/types";
import { getWorkspacePanels } from "./selectors";
import { WorkspaceTabOptions } from "./types";

// Coordinates tab state for the live workspace after the page shell is mounted.
export function initWorkspaceTabs(options: WorkspaceTabOptions): void {
  const workspacePanels = getWorkspacePanels();

  for (const button of Array.from(document.querySelectorAll<HTMLButtonElement>("[data-tab]"))) {
    button.id = `tab-${button.dataset.tab}`;
    button.addEventListener("click", () => {
      activateTab(button.dataset.tab as TabId, {
        workspacePanels,
        updateHash: true,
        scrollPanelIntoView: true,
        onTabActivated: options.onTabActivated
      });
    });
  }

  window.addEventListener("hashchange", () => {
    const nextTab = getTabFromHash(window.location.hash);

    if (!nextTab) {
      return;
    }

    activateTab(nextTab, {
      workspacePanels,
      updateHash: false,
      scrollPanelIntoView: false,
      onTabActivated: options.onTabActivated
    });
  });

  activateTab(getTabFromHash(window.location.hash) ?? options.defaultTab, {
    workspacePanels,
    updateHash: false,
    scrollPanelIntoView: false,
    onTabActivated: options.onTabActivated
  });
}

function activateTab(
  tabId: TabId,
  options: {
    workspacePanels: HTMLElement;
    updateHash: boolean;
    scrollPanelIntoView: boolean;
    onTabActivated?: (tabId: TabId) => void;
  }
): void {
  for (const button of Array.from(document.querySelectorAll<HTMLButtonElement>("[data-tab]"))) {
    const active = button.dataset.tab === tabId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  }

  for (const panel of Array.from(document.querySelectorAll<HTMLElement>("[data-panel]"))) {
    const active = panel.dataset.panel === tabId;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  }

  options.workspacePanels.dataset.activeTab = tabId;

  if (options.updateHash) {
    window.history.replaceState(null, "", `#${tabId}`);
  }

  if (options.scrollPanelIntoView) {
    document.querySelector<HTMLElement>(`[data-panel="${tabId}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  options.onTabActivated?.(tabId);
}

function getTabFromHash(hash: string): TabId | null {
  const normalized = hash.replace(/^#/, "");

  if (
    normalized === "text-extract"
    || normalized === "url-extract"
    || normalized === "usage"
    || normalized === "docs"
  ) {
    return normalized;
  }

  return null;
}
