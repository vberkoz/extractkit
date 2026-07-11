function stripHtmlTags(html: string, tagNames: string[]): string {
  let result = html;

  for (const tagName of tagNames) {
    const pairPattern = new RegExp(
      `<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`,
      "gi"
    );
    const selfClosingPattern = new RegExp(`<${tagName}\\b[^>]*\\/?>`, "gi");

    result = result.replace(pairPattern, " ");
    result = result.replace(selfClosingPattern, " ");
  }

  return result;
}

function decodeBasicHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

export function htmlToReadableText(html: string): string {
  const withoutIgnoredTags = stripHtmlTags(html, ["script", "style", "nav", "footer", "svg"]);
  const withBlockBreaks = withoutIgnoredTags
    .replace(/<(?:br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|main|aside|header|li|ul|ol|h[1-6]|table|tr)>/gi, "\n");
  const withoutTags = withBlockBreaks.replace(/<[^>]+>/g, " ");
  const decoded = decodeBasicHtmlEntities(withoutTags);

  return decoded
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
