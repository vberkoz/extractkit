import { getById } from "../../lib/dom";

export type UrlExtractElements = {
  urlInput: HTMLInputElement;
  schemaInput: HTMLTextAreaElement;
  status: HTMLElement;
  result: HTMLElement;
  submitButton: HTMLButtonElement;
};

export function getUrlExtractElements(): UrlExtractElements {
  return {
    urlInput: getById<HTMLInputElement>("url-input"),
    schemaInput: getById<HTMLTextAreaElement>("url-schema"),
    status: getById<HTMLElement>("url-status"),
    result: getById<HTMLElement>("url-result"),
    submitButton: getById<HTMLButtonElement>("extract-url")
  };
}
