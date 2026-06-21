import type { JsonValue } from "./json";

export type ExtractRequest = {
  content: string;
  schema: Record<string, JsonValue>;
  options?: {
    mode?: string;
    debug?: boolean;
  };
};

export type ExtractUrlRequest = {
  url: string;
  extractRequest: ExtractRequest;
};

export type ExtractPdfRequest = {
  pdfUrl: string;
  schema: Record<string, JsonValue>;
  options?: {
    debug?: boolean;
  };
};

export type HtmlExtractionHints = {
  title: string | null;
  metaDescription: string | null;
  sourceUrl: string;
};

export type ExtractResponse = {
  jobId: string;
  data: JsonValue;
  confidence: number;
  usage: {
    units: number;
  };
};

export type ExtractionEngineResult = {
  data: JsonValue;
  confidence: number;
};
