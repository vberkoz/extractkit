import { getById } from "../../lib/dom";

export type TextExtractElements = {
  contentInput: HTMLTextAreaElement;
  schemaInput: HTMLTextAreaElement;
  rawInputPreview: HTMLElement;
  status: HTMLElement;
  result: HTMLElement;
  submitButton: HTMLButtonElement;
};

export function getTextExtractElements(): TextExtractElements {
  return {
    contentInput: getById<HTMLTextAreaElement>("text-content"),
    schemaInput: getById<HTMLTextAreaElement>("text-schema"),
    rawInputPreview: getById<HTMLElement>("text-raw-input"),
    status: getById<HTMLElement>("text-status"),
    result: getById<HTMLElement>("text-result"),
    submitButton: getById<HTMLButtonElement>("extract-text")
  };
}
