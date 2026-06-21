import { getById } from "../../lib/dom";

export type UsageElements = {
  usedValue: HTMLElement;
  limitValue: HTMLElement;
  planValue: HTMLElement;
  status: HTMLElement;
  refreshButton: HTMLButtonElement;
};

export function getUsageElements(): UsageElements {
  return {
    usedValue: getById<HTMLElement>("usage-used"),
    limitValue: getById<HTMLElement>("usage-limit"),
    planValue: getById<HTMLElement>("usage-plan"),
    status: getById<HTMLElement>("usage-status"),
    refreshButton: getById<HTMLButtonElement>("refresh-usage")
  };
}
