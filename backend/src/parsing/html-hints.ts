import type { HtmlExtractionHints } from "../domain/extraction";

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

export function extractHtmlHints(html: string, sourceUrl: string): HtmlExtractionHints {
  return {
    title: extractTagText(html, "title"),
    metaDescription: extractMetaContent(html, "description"),
    sourceUrl
  };
}
