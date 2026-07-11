export function getJobKind(jobId: string | undefined): "text" | "url" | "pdf" | "other" {
  if (!jobId) {
    return "other";
  }

  const [prefix] = jobId.split("_");

  if (prefix === "extract") {
    return "text";
  }

  if (prefix === "url") {
    return "url";
  }

  if (prefix === "pdf") {
    return "pdf";
  }

  return "other";
}
