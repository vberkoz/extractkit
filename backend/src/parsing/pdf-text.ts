import type { PdfPageText } from "../domain/pdf";

export function pickPreferredPdfPageText(nativeText: string, ocrText: string): string {
  if (!isUsableNativePdfText(nativeText) && ocrText.trim() !== "") {
    return ocrText;
  }

  const nativeScore = scorePdfTextQuality(nativeText);
  const ocrScore = scorePdfTextQuality(ocrText);
  return ocrScore > nativeScore ? ocrText : nativeText;
}

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

export function isUsableNativePdfText(text: string): boolean {
  return scorePdfTextQuality(text) >= 4;
}

export function scorePdfTextQuality(text: string): number {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized === "") {
    return 0;
  }

  const characters = normalized.length;
  const words = normalized.split(/\s+/).filter(Boolean);
  const alphanumericCount = (normalized.match(/[A-Za-z0-9]/g) ?? []).length;
  const replacementCharCount = (normalized.match(/\uFFFD/g) ?? []).length;
  const spacedCharacterRuns = (normalized.match(/\b(?:[A-Za-z]\s+){5,}[A-Za-z]\b/g) ?? []).length;
  const alphanumericRatio = alphanumericCount / characters;

  let score = 0;

  if (characters >= 40) {
    score += 2;
  } else if (characters >= 16) {
    score += 1;
  }

  if (words.length >= 8) {
    score += 2;
  } else if (words.length >= 4) {
    score += 1;
  }

  if (alphanumericRatio >= 0.55) {
    score += 2;
  } else if (alphanumericRatio >= 0.4) {
    score += 1;
  }

  if (replacementCharCount > 0) {
    score -= 2;
  }

  if (spacedCharacterRuns > 0) {
    score -= 2;
  }

  return score;
}
