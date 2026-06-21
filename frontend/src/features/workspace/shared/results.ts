export function formatResultPayload(payload: unknown): string {
  return JSON.stringify(payload, null, 2);
}

export function ensureIdleMessage(resultEl: HTMLElement, idleMessage: string): void {
  if (resultEl.textContent?.trim() === "") {
    resultEl.textContent = idleMessage;
  }
}
