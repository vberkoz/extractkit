export function loadStoredValue(storageKey: string): string {
  return localStorage.getItem(storageKey) ?? "";
}

export function persistInputValue(input: HTMLInputElement, storageKey: string): void {
  input.value = loadStoredValue(storageKey);
  input.addEventListener("input", () => {
    localStorage.setItem(storageKey, input.value.trim());
  });
}
