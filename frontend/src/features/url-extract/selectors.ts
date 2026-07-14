import { getById } from "../../lib/dom";

export type UrlExtractElements = {
  urlInput: HTMLInputElement;
  schemaInput: HTMLTextAreaElement;
  rawInputPreview: HTMLElement;
  status: HTMLElement;
  result: HTMLElement;
  submitButton: HTMLButtonElement;
};

export function getUrlExtractElements(): UrlExtractElements {
  return {
    urlInput: getById<HTMLInputElement>("url-input"),
    schemaInput: getById<HTMLTextAreaElement>("url-schema"),
    rawInputPreview: getById<HTMLElement>("url-raw-input"),
    status: getById<HTMLElement>("url-status"),
    result: getById<HTMLElement>("url-result"),
    submitButton: getById<HTMLButtonElement>("extract-url")
  };
}
