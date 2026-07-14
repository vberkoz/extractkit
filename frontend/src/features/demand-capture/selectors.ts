import { getById } from "../../lib/dom";

export type DemandCaptureElements = {
  form: HTMLFormElement;
  needInput: HTMLTextAreaElement;
  sourceFormatInput: HTMLInputElement;
  frequencyInput: HTMLInputElement;
  contactEmailInput: HTMLInputElement;
  submitButton: HTMLButtonElement;
  status: HTMLElement;
};

export function getDemandCaptureElements(): DemandCaptureElements {
  return {
    form: getById<HTMLFormElement>("demand-capture-form"),
    needInput: getById<HTMLTextAreaElement>("demand-need"),
    sourceFormatInput: getById<HTMLInputElement>("demand-source-format-value"),
    frequencyInput: getById<HTMLInputElement>("demand-frequency-value"),
    contactEmailInput: getById<HTMLInputElement>("demand-contact-email"),
    submitButton: getById<HTMLButtonElement>("demand-capture-submit"),
    status: getById<HTMLElement>("demand-capture-status")
  };
}
