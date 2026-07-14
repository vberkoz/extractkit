export type WorkspaceExample = {
  id: string;
  label: string;
  description: string;
  schema: string;
  content?: string;
  url?: string;
  pdfUrl?: string;
};

function makeSchema(value: Record<string, string>): string {
  return JSON.stringify(value, null, 2);
}

export const TEXT_EXAMPLES: WorkspaceExample[] = [
  {
    id: "lead-qualification",
    label: "Lead qualification",
    description: "Clean up inbound contact details from a pasted note.",
    content:
      "Name: Jane Doe\nEmail: jane.doe@acme.com\nCompany: Acme Labs\nBudget: $20k\nTimeline: This quarter",
    schema: makeSchema({
      name: "string",
      email: "email",
      company: "string",
      budget: "string",
      timeline: "string"
    })
  },
  {
    id: "invoice-summary",
    label: "Invoice summary",
    description: "Pull key billing fields from a raw text invoice.",
    content:
      "Vendor: Northwind Supplies\nInvoice #: INV-1842\nDue date: 2026-08-14\nTotal: $4,890.00\nStatus: unpaid",
    schema: makeSchema({
      vendor: "string",
      invoiceNumber: "string",
      dueDate: "date",
      totalAmount: "number"
    })
  },
  {
    id: "support-triage",
    label: "Support triage",
    description: "Normalize a support note into structured ticket fields.",
    content:
      "Customer: Maya Patel\nProduct: Analytics\nIssue: export CSV button fails on Safari\nPriority: high\nSentiment: frustrated",
    schema: makeSchema({
      customer: "string",
      product: "string",
      issue: "string",
      priority: "string",
      sentiment: "string"
    })
  }
];

export const URL_EXAMPLES: WorkspaceExample[] = [
  {
    id: "article-summary",
    label: "Article summary",
    description: "Turn a live article into a title and summary payload.",
    url: "https://en.wikipedia.org/wiki/JSON",
    schema: makeSchema({
      title: "string",
      summary: "string",
      category: "string"
    })
  },
  {
    id: "product-update",
    label: "Product update",
    description: "Extract metadata from a live blog-style update page.",
    url: "https://www.theverge.com/2024/5/13/24154343/openai-gpt-4o-announcement-liveblog",
    schema: makeSchema({
      title: "string",
      summary: "string",
      publishedAt: "date"
    })
  },
  {
    id: "documentation-page",
    label: "Documentation page",
    description: "Structure content from a technical documentation page.",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON",
    schema: makeSchema({
      title: "string",
      summary: "string",
      section: "string"
    })
  }
];

export const PDF_EXAMPLES: WorkspaceExample[] = [
  {
    id: "sample-report",
    label: "Sample report",
    description: "Process a bundled sample PDF and extract document-level fields.",
    pdfUrl: "/assets/sample-pdfs/extractkit-demo.pdf",
    schema: makeSchema({
      documentTitle: "string",
      summary: "string",
      keyTopic: "string"
    })
  },
  {
    id: "dummy-file",
    label: "Simple PDF",
    description: "Use a bundled sample PDF to prove the flow quickly.",
    pdfUrl: "/assets/sample-pdfs/extractkit-demo.pdf",
    schema: makeSchema({
      documentTitle: "string",
      summary: "string",
      pageType: "string"
    })
  },
  {
    id: "public-handbook",
    label: "Public handbook",
    description: "Capture structure from a longer bundled PDF document.",
    pdfUrl: "/assets/sample-pdfs/extractkit-demo.pdf",
    schema: makeSchema({
      documentTitle: "string",
      summary: "string",
      section: "string"
    })
  }
];
