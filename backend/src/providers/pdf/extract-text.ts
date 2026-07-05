import type { PdfPageText, PdfParseConstructor } from "../../domain/pdf";
import {
  isUsableNativePdfText,
  joinPdfPages,
  normalizePdfPageText,
  pickPreferredPdfPageText
} from "../../parsing/pdf-text";
import { extractDocumentTextWithTextract } from "../textract/extract-text";

let pdfParseConstructorPromise: Promise<PdfParseConstructor> | null = null;

export async function extractPdfTextIntelligently(
  pdfBytes: Uint8Array
): Promise<string> {
  const nativePages = await tryExtractPdfTextNatively(pdfBytes);

  if (nativePages === null || nativePages.length === 0) {
    return await extractDocumentTextWithTextract(pdfBytes, {
      mimeType: "application/pdf"
    });
  }

  const weakPages = nativePages.filter((page) => !isUsableNativePdfText(page.text));

  if (weakPages.length === 0) {
    return joinPdfPages(nativePages);
  }

  if (weakPages.length === nativePages.length) {
    return await extractDocumentTextWithTextract(pdfBytes, {
      mimeType: "application/pdf"
    });
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
    return await extractDocumentTextWithTextract(pdfBytes, {
      mimeType: "application/pdf"
    });
  }
}

async function getPdfParseConstructor(): Promise<PdfParseConstructor> {
  if (!pdfParseConstructorPromise) {
    pdfParseConstructorPromise = import("pdf-parse")
      .then((module) => module.PDFParse as PdfParseConstructor)
      .catch((error) => {
        pdfParseConstructorPromise = null;
        throw error;
      });
  }

  return await pdfParseConstructorPromise;
}

async function tryExtractPdfTextNatively(pdfBytes: Uint8Array): Promise<PdfPageText[] | null> {
  let parser: InstanceType<PdfParseConstructor> | null = null;

  try {
    const PDFParse = await getPdfParseConstructor();
    parser = new PDFParse({ data: Buffer.from(pdfBytes) });
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
    await parser?.destroy();
  }
}

async function extractHybridPdfText(
  pdfBytes: Uint8Array,
  nativePages: PdfPageText[],
  weakPages: PdfPageText[]
): Promise<PdfPageText[]> {
  const weakPageNumbers = new Set(weakPages.map((page) => page.pageNumber));
  let parser: InstanceType<PdfParseConstructor> | null = null;

  try {
    const PDFParse = await getPdfParseConstructor();
    parser = new PDFParse({ data: Buffer.from(pdfBytes) });
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
        await extractDocumentTextWithTextract(screenshot.data, {
          mimeType: "image/png"
        })
      );

      mergedPages.push({
        pageNumber: page.pageNumber,
        text: pickPreferredPdfPageText(page.text, ocrText)
      });
    }

    return mergedPages;
  } finally {
    await parser?.destroy();
  }
}
