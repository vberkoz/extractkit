import { getById } from "../../lib/dom";

export function getWorkspacePanels(): HTMLElement {
  return getById<HTMLElement>("workspace-panels");
}
