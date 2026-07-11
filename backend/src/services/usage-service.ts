export function getCurrentUsagePeriod(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getPlanUsageLimit(plan: string): number {
  const normalizedPlan = plan.trim().toLowerCase();

  switch (normalizedPlan) {
    case "dev":
      return 10_000;
    default:
      return 10_000;
  }
}
