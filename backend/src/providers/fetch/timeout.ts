export function withAbortTimeout(timeoutMs: number): {
  abortController: AbortController;
  clear: () => void;
} {
  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);

  return {
    abortController,
    clear: () => clearTimeout(timeout)
  };
}
