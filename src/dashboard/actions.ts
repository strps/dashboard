"use server";

import {
  type DashboardLayoutRecord,
  getDashboardLayout,
  saveDashboardLayout,
} from "@/lib/dal/dashboardLayout";

export async function getDashboardLayoutAction(): Promise<DashboardLayoutRecord | null> {
  return getDashboardLayout();
}

export async function saveDashboardLayoutAction(
  input: DashboardLayoutRecord,
): Promise<void> {
  await saveDashboardLayout(input);
}
