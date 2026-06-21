export function getById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }

  return element as T;
}

export function setStatus(
  element: HTMLElement,
  message: string,
  state: "pending" | "success" | "error"
): void {
  element.textContent = message;
  element.dataset.state = state;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
