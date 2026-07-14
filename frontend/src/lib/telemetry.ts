import { API_BASE_URL } from "../config/runtime";
import { postPublicJson } from "./api";
import { loadStoredValue } from "./storage";

const VISITOR_ID_STORAGE_KEY = "extractkit.visitorId";

export type IntentEventType =
  | "hero_cta_click"
  | "sample_selected"
  | "schema_edited"
  | "extraction_started"
  | "extraction_succeeded";

export type IntentSurface = "hero" | "workspace" | "demand-capture";

export type TrackIntentEventInput = {
  eventType: IntentEventType;
  surface: IntentSurface;
  sampleKind?: "text" | "url" | "pdf";
  useCaseId?: string;
  useCaseLabel?: string;
  schemaEdited?: boolean;
};

export async function trackIntentEvent(input: TrackIntentEventInput): Promise<void> {
  try {
    await postPublicJson(
      API_BASE_URL,
      "/v1/events",
      {
        visitorId: getVisitorId(),
        eventType: input.eventType,
        surface: input.surface,
        ...(input.sampleKind ? { sampleKind: input.sampleKind } : {}),
        ...(input.useCaseId ? { useCaseId: input.useCaseId } : {}),
        ...(input.useCaseLabel ? { useCaseLabel: input.useCaseLabel } : {}),
        ...(input.schemaEdited === undefined ? {} : { schemaEdited: input.schemaEdited })
      },
      {
        keepalive: true
      }
    );
  } catch {
    // Tracking must never block the demo or the extraction flow.
  }
}

export function getVisitorId(): string {
  const stored = loadStoredValue(VISITOR_ID_STORAGE_KEY).trim();

  if (stored) {
    return stored;
  }

  const visitorId = createVisitorId();
  localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
  return visitorId;
}

function createVisitorId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `visitor_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
