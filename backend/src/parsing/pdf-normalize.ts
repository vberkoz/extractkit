import type { PdfPageText } from "../domain/pdf";

export function normalizePdfPageText(text: string): string {
  return text.replace(/\u0000/g, "").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function joinPdfPages(pages: PdfPageText[]): string {
  return pages
    .sort((left, right) => left.pageNumber - right.pageNumber)
    .map((page) => page.text.trim())
    .filter((text) => text !== "")
    .join("\n\n--- Page Break ---\n\n")
    .trim();
}
