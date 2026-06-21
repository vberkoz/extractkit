import { getErrorMessage, setStatus } from "../../lib/dom";
import { UsageData } from "../../lib/types";
import { runPendingState } from "../workspace/shared/actions";
import { getUsageElements } from "./selectors";

export function createUsageFeature(callApi: <T>(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  }
) => Promise<T>) {
  const elements = getUsageElements();

  elements.refreshButton.addEventListener("click", async () => {
    await loadUsage();
  });

  async function loadUsage(): Promise<void> {
    await runPendingState(elements.refreshButton, elements.status, "Loading usage...");

    try {
      const response = await callApi<UsageData>("/v1/usage", {
        method: "GET"
      });

      elements.usedValue.textContent = String(response.used);
      elements.limitValue.textContent = String(response.limit);
      elements.planValue.textContent = response.plan;
      setStatus(elements.status, `Usage loaded for ${response.month}.`, "success");
    } catch (error) {
      elements.usedValue.textContent = "-";
      elements.limitValue.textContent = "-";
      elements.planValue.textContent = "-";
      setStatus(elements.status, getErrorMessage(error), "error");
    } finally {
      elements.refreshButton.disabled = false;
      elements.refreshButton.textContent = "Refresh Usage";
    }
  }

  function loadIfNeeded(): void {
    if (elements.usedValue.textContent === "-") {
      void loadUsage();
    }
  }

  return {
    loadIfNeeded
  };
}
