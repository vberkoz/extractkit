import { getErrorMessage, setStatus } from "../../../lib/dom";
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
}): Promise<void> {
  await runPendingState(options.button, options.statusEl, options.pendingMessage);

  try {
    const response = await options.request();
    options.resultEl.textContent = formatResultPayload(response);
    setStatus(options.statusEl, options.successMessage, "success");
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
