import { getErrorMessage, setStatus } from "../../../lib/dom";
import { scrollElementWithOffset } from "../../../lib/router";
import { ensureIdleMessage, formatResultPayload } from "./results";

export async function runPendingState(
  button: HTMLButtonElement,
  statusEl: HTMLElement,
  pendingMessage: string
): Promise<void> {
  button.disabled = true;
  button.textContent = "Working...";
  setStatus(statusEl, pendingMessage, "pending");
}

export async function runAction(options: {
  button: HTMLButtonElement;
  buttonLabel: string;
  statusEl: HTMLElement;
  resultEl: HTMLElement;
  idleMessage: string;
  pendingMessage: string;
  successMessage: string;
  request: () => Promise<unknown>;
  onStart?: () => void;
  onSuccess?: (response: unknown) => void;
  scrollOffset?: number;
}): Promise<void> {
  await runPendingState(options.button, options.statusEl, options.pendingMessage);

  try {
    options.onStart?.();
    const response = await options.request();
    options.resultEl.textContent = formatResultPayload(response);
    setStatus(options.statusEl, options.successMessage, "success");
    options.onSuccess?.(response);
    window.requestAnimationFrame(() => {
      scrollElementWithOffset(options.button, options.scrollOffset ?? 24);
    });
  } catch (error) {
    options.resultEl.textContent = formatResultPayload({
      error: getErrorMessage(error)
    });
    setStatus(options.statusEl, getErrorMessage(error), "error");
  } finally {
    options.button.disabled = false;
    options.button.textContent = options.buttonLabel;
    ensureIdleMessage(options.resultEl, options.idleMessage);
  }
}
