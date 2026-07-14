import { getById } from "../../lib/dom";

export type PdfExtractElements = {
  pdfUrlInput: HTMLInputElement;
  schemaInput: HTMLTextAreaElement;
  rawInputPreview: HTMLElement;
  status: HTMLElement;
  result: HTMLElement;
  submitButton: HTMLButtonElement;
};

export function getPdfExtractElements(): PdfExtractElements {
  return {
    pdfUrlInput: getById<HTMLInputElement>("pdf-url-input"),
    schemaInput: getById<HTMLTextAreaElement>("pdf-schema"),
    rawInputPreview: getById<HTMLElement>("pdf-raw-input"),
    status: getById<HTMLElement>("pdf-status"),
    result: getById<HTMLElement>("pdf-result"),
    submitButton: getById<HTMLButtonElement>("extract-pdf")
  };
}
