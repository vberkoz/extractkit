import { AppRoute } from "./types";

export function updateDocumentMetadata(route: AppRoute): void {
  const metadata = route === "stats"
    ? {
        title: "ExtractKit Stats",
        description: "View analytics, operational health, and request mix for ExtractKit."
      }
    : {
        title: "ExtractKit",
        description: "Structured extraction for developer teams with a clean demo workspace."
      };

  document.title = metadata.title;
  updateMetaTag('meta[name="description"]', metadata.description);
  updateMetaTag('meta[property="og:title"]', metadata.title);
  updateMetaTag('meta[property="og:description"]', metadata.description);
}

function updateMetaTag(selector: string, content: string): void {
  const meta = document.querySelector<HTMLMetaElement>(selector);

  if (meta) {
    meta.content = content;
    return;
  }

  const nextMeta = document.createElement("meta");

  if (selector.includes('name="')) {
    nextMeta.setAttribute("name", selector.match(/name="([^"]+)"/)?.[1] ?? "");
  }

  if (selector.includes('property="')) {
    nextMeta.setAttribute("property", selector.match(/property="([^"]+)"/)?.[1] ?? "");
  }

  nextMeta.content = content;
  document.head.appendChild(nextMeta);
}
