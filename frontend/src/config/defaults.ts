export const DEFAULT_TEXT_SCHEMA = JSON.stringify(
  {
    name: "string",
    email: "email",
    company: "string"
  },
  null,
  2
);

export const DEFAULT_URL_SCHEMA = JSON.stringify(
  {
    title: "string",
    summary: "string",
    publishedAt: "date"
  },
  null,
  2
);

export const DEFAULT_PDF_SCHEMA = JSON.stringify(
  {
    documentTitle: "string",
    invoiceNumber: "string",
    totalAmount: "number"
  },
  null,
  2
);
