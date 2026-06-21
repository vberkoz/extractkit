export type PdfPageText = {
  pageNumber: number;
  text: string;
};

export type PdfParseConstructor = new (input: { data: Buffer }) => {
  getText: (options?: Record<string, unknown>) => Promise<{
    pages: Array<{ num: number; text: string }>;
  }>;
  getScreenshot: (options?: Record<string, unknown>) => Promise<{
    pages: Array<{ data: Uint8Array; pageNumber: number }>;
  }>;
  destroy: () => Promise<void>;
};
