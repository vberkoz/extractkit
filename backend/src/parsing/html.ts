import type { HtmlExtractionHints } from "../domain/extraction";

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

export function extractHtmlHints(html: string, sourceUrl: string): HtmlExtractionHints {
  return {
    title: extractTagText(html, "title"),
    metaDescription: extractMetaContent(html, "description"),
    sourceUrl
  };
}

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

function extractTagText(html: string, tagName: string): string | null {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = html.match(pattern);

  if (!match) {
    return null;
  }

  const text = decodeBasicHtmlEntities(match[1].replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

  return text === "" ? null : text;
}

function extractMetaContent(html: string, metaName: string): string | null {
  const metaTagPattern = /<meta\b[^>]*>/gi;
  const metaTags = html.match(metaTagPattern) ?? [];

  for (const tag of metaTags) {
    const nameValue = readHtmlAttribute(tag, "name") ?? readHtmlAttribute(tag, "property");

    if (!nameValue || nameValue.trim().toLowerCase() !== metaName.toLowerCase()) {
      continue;
    }

    const contentValue = readHtmlAttribute(tag, "content");

    if (!contentValue) {
      continue;
    }

    const normalized = decodeBasicHtmlEntities(contentValue).replace(/\s+/g, " ").trim();

    if (normalized !== "") {
      return normalized;
    }
  }

  return null;
}

function readHtmlAttribute(tag: string, attributeName: string): string | null {
  const pattern = new RegExp(
    `${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + "`" + `]+))`,
    "i"
  );
  const match = tag.match(pattern);

  if (!match) {
    return null;
  }

  return match[1] ?? match[2] ?? match[3] ?? null;
}
