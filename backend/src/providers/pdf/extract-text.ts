import type { PdfPageText, PdfParseConstructor } from "../../domain/pdf";
import {
  isUsableNativePdfText,
  joinPdfPages,
  normalizePdfPageText,
  pickPreferredPdfPageText
} from "../../parsing/pdf-text";
import { extractDocumentTextWithTextract } from "../textract/extract-text";

let pdfParseConstructorPromise: Promise<PdfParseConstructor> | null = null;

export async function extractPdfTextIntelligently(pdfBytes: Uint8Array): Promise<string> {
  const nativePages = await tryExtractPdfTextNatively(pdfBytes);

  if (nativePages === null || nativePages.length === 0) {
    return await extractDocumentTextWithTextract(pdfBytes);
  }

  const weakPages = nativePages.filter((page) => !isUsableNativePdfText(page.text));

  if (weakPages.length === 0) {
    return joinPdfPages(nativePages);
  }

  if (weakPages.length === nativePages.length) {
    return await extractDocumentTextWithTextract(pdfBytes);
  }

  try {
    const hybridPages = await extractHybridPdfText(pdfBytes, nativePages, weakPages);
    return joinPdfPages(hybridPages);
  } catch (error) {
    console.error("Selective PDF OCR fallback failed", {
      message: error instanceof Error ? error.message : "Unknown error",
      weakPageCount: weakPages.length,
      totalPages: nativePages.length
    });
    return await extractDocumentTextWithTextract(pdfBytes);
  }
}

async function getPdfParseConstructor(): Promise<PdfParseConstructor> {
  if (!pdfParseConstructorPromise) {
    pdfParseConstructorPromise = import("pdf-parse")
      .then((module) => module.PDFParse as PdfParseConstructor);
  }

  return await pdfParseConstructorPromise;
}

async function tryExtractPdfTextNatively(pdfBytes: Uint8Array): Promise<PdfPageText[] | null> {
  const PDFParse = await getPdfParseConstructor();
  const parser = new PDFParse({ data: Buffer.from(pdfBytes) });

  try {
    const result = await parser.getText({
      imageBuffer: false,
      imageDataUrl: false,
      pageJoiner: "",
      itemJoiner: " "
    });

    return result.pages.map((page) => ({
      pageNumber: page.num,
      text: normalizePdfPageText(page.text)
    }));
  } catch (error) {
    console.error("Native PDF text extraction failed", {
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return null;
  } finally {
    await parser.destroy();
  }
}

async function extractHybridPdfText(
  pdfBytes: Uint8Array,
  nativePages: PdfPageText[],
  weakPages: PdfPageText[]
): Promise<PdfPageText[]> {
  const PDFParse = await getPdfParseConstructor();
  const parser = new PDFParse({ data: Buffer.from(pdfBytes) });
  const weakPageNumbers = new Set(weakPages.map((page) => page.pageNumber));

  try {
    const mergedPages: PdfPageText[] = [];

    for (const page of nativePages) {
      if (!weakPageNumbers.has(page.pageNumber)) {
        mergedPages.push(page);
        continue;
      }

      const screenshotResult = await parser.getScreenshot({
        partial: [page.pageNumber],
        desiredWidth: 1600,
        imageBuffer: true,
        imageDataUrl: false
      });
      const screenshot = screenshotResult.pages[0];

      if (!screenshot?.data || screenshot.data.length === 0) {
        mergedPages.push(page);
        continue;
      }

      const ocrText = normalizePdfPageText(
        await extractDocumentTextWithTextract(screenshot.data)
      );

      mergedPages.push({
        pageNumber: page.pageNumber,
        text: pickPreferredPdfPageText(page.text, ocrText)
      });
    }

    return mergedPages;
  } finally {
    await parser.destroy();
  }
}
