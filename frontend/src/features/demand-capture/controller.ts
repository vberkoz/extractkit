import { API_BASE_URL } from "../../config/runtime";
import { getErrorMessage, setStatus } from "../../lib/dom";
import { postPublicJson } from "../../lib/api";
import type { DemandCaptureData } from "../../lib/types";
import { initCustomSelects } from "./custom-select";
import { getDemandCaptureElements } from "./selectors";

export function initDemandCaptureFeature(): () => void {
  const elements = getDemandCaptureElements();
  const cleanupCustomSelects = initCustomSelects();

  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();

    await submitDemandCapture({
      need: elements.needInput.value,
      sourceFormat: elements.sourceFormatInput.value,
      frequency: elements.frequencyInput.value,
      contactEmail: elements.contactEmailInput.value.trim(),
      entryPoint: "hero"
    });
  });

  async function submitDemandCapture(body: {
    need: string;
    sourceFormat: string;
    frequency: string;
    contactEmail: string;
    entryPoint: string;
  }): Promise<void> {
    const payload = {
      need: body.need,
      sourceFormat: body.sourceFormat,
      frequency: body.frequency,
      ...(body.contactEmail ? { contactEmail: body.contactEmail } : {}),
      entryPoint: body.entryPoint
    };

    setStatus(elements.status, "Sending demand signal...", "pending");
    elements.submitButton.disabled = true;

    try {
      const response = await postPublicJson<DemandCaptureData>(
        API_BASE_URL,
        "/v1/interest",
        payload
      );

      setStatus(
        elements.status,
        `Thanks. We captured that signal at ${formatTimestamp(response.capturedAt)}.`,
        "success"
      );
    } catch (error) {
      setStatus(elements.status, getErrorMessage(error), "error");
    } finally {
      elements.submitButton.disabled = false;
    }
  }

  return () => {
    cleanupCustomSelects();
  };
}

export function revealDemandFollowups(): void {
  for (const prompt of Array.from(document.querySelectorAll<HTMLElement>("[data-demand-followup]"))) {
    prompt.hidden = false;
  }
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));
}
