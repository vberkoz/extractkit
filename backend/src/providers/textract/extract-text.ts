import { HttpError } from "../../http/errors";
import { Block, DetectDocumentTextCommand, getTextractClient } from "./client";

export async function extractDocumentTextWithTextract(documentBytes: Uint8Array): Promise<string> {
  try {
    const response = await getTextractClient().send(
      new DetectDocumentTextCommand({
        Document: {
          Bytes: documentBytes
        }
      })
    );

    return buildTextFromTextractBlocks(response.Blocks ?? []);
  } catch (error) {
    console.error("Textract OCR failed", {
      message: error instanceof Error ? error.message : "Unknown error"
    });

    throw new HttpError(
      502,
      "PDF_OCR_FAILED",
      "Textract OCR failed for the supplied document."
    );
  }
}

function buildTextFromTextractBlocks(blocks: Block[]): string {
  const linesByPage = new Map<number, string[]>();

  for (const block of blocks) {
    if (block.BlockType !== "LINE" || !block.Text) {
      continue;
    }

    const page = block.Page ?? 1;
    const lines = linesByPage.get(page) ?? [];
    lines.push(block.Text);
    linesByPage.set(page, lines);
  }

  return Array.from(linesByPage.entries())
    .sort(([left], [right]) => left - right)
    .map(([page, lines]) => [`Page ${page}`, ...lines].join("\n"))
    .join("\n\n")
    .trim();
}
