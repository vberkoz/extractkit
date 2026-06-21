import { TabId } from "../../lib/types";

export type WorkspaceTabOptions = {
  defaultTab: TabId;
  onTabActivated?: (tabId: TabId) => void;
};
