import type { Block } from "./client";

export function buildTextFromTextractBlocks(blocks: Block[]): string {
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
