export const SAMPLE_TEXT_EXTRACT_REQUEST = {
  content: [
    "companyName: Acme Inc",
    "contactEmail: hello@acme.com",
    "price: $1,200.50",
    "active: yes",
    "launchedOn: March 4, 2025",
    "tags: alpha, beta",
    "scores: 10, 20, 30",
    "website: https://acme.com"
  ].join("\n"),
  schema: {
    companyName: "string",
    contactEmail: "email",
    price: "number",
    active: "boolean",
    launchedOn: "date",
    tags: "array:string",
    scores: "array:number",
    website: "url"
  },
  options: {
    mode: "sync",
    debug: true
  }
};

export const SAMPLE_URL_EXTRACT_REQUEST = {
  url: "https://example.com",
  schema: {
    title: "string"
  },
  options: {
    mode: "sync"
  }
};

export const SAMPLE_PDF_EXTRACT_REQUEST = {
  pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  schema: {
    document: {
      title: "string",
      firstLine: "string"
    }
  }
};
