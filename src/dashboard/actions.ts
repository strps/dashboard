"use server";

import { z } from "zod";

import {
  type DashboardRecord,
  createDashboard,
  deleteDashboard,
  listDashboards,
  renameDashboard,
} from "@/lib/dal/dashboards";
import {
  type DashboardLayoutRecord,
  getDashboardLayout,
  saveDashboardLayout,
} from "@/lib/dal/dashboardLayout";

// --- Dashboard tab actions ---

export async function listDashboardsAction(): Promise<DashboardRecord[]> {
  return listDashboards();
}

const CreateDashboardInput = z.object({
  name: z.string().min(1).max(64),
  type: z.enum(["widgets", "custom"]),
  order: z.number().int().min(0),
});

export async function createDashboardAction(
  input: z.infer<typeof CreateDashboardInput>,
): Promise<{ id: string }> {
  const parsed = CreateDashboardInput.parse(input);
  const id = crypto.randomUUID();
  await createDashboard(id, parsed.name, parsed.type, parsed.order);
  return { id };
}

const RenameDashboardInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(64),
});

export async function renameDashboardAction(
  input: z.infer<typeof RenameDashboardInput>,
): Promise<void> {
  const parsed = RenameDashboardInput.parse(input);
  await renameDashboard(parsed.id, parsed.name);
}

const DeleteDashboardInput = z.object({ id: z.string().min(1) });

export async function deleteDashboardAction(
  input: z.infer<typeof DeleteDashboardInput>,
): Promise<void> {
  const parsed = DeleteDashboardInput.parse(input);
  await deleteDashboard(parsed.id);
}

// --- Layout actions ---

export async function getDashboardLayoutAction(
  dashboardId: string,
): Promise<DashboardLayoutRecord | null> {
  return getDashboardLayout(dashboardId);
}

export async function saveDashboardLayoutAction(
  dashboardId: string,
  input: DashboardLayoutRecord,
): Promise<void> {
  await saveDashboardLayout(dashboardId, input);
}
