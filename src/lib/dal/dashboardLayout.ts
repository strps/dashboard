import "server-only";

import { and, eq } from "drizzle-orm";
import type { LayoutItem } from "react-grid-layout";

import { db } from "@/lib/db";
import { dashboard, dashboardLayout } from "@/lib/db/schema";

import { verifySession } from "./session";

export interface DashboardLayoutRecord {
  layout: LayoutItem[];
  instances: { id: string; type: string; config?: unknown }[];
  locked: boolean;
}

export async function getDashboardLayout(
  dashboardId: string,
): Promise<DashboardLayoutRecord | null> {
  const { userId } = await verifySession();
  const [row] = await db
    .select({
      layout: dashboardLayout.layout,
      instances: dashboardLayout.instances,
      locked: dashboardLayout.locked,
    })
    .from(dashboardLayout)
    .innerJoin(dashboard, eq(dashboardLayout.dashboardId, dashboard.id))
    .where(
      and(
        eq(dashboardLayout.dashboardId, dashboardId),
        eq(dashboard.userId, userId),
      ),
    )
    .limit(1);
  if (!row) return null;
  return { layout: row.layout, instances: row.instances, locked: row.locked };
}

export async function saveDashboardLayout(
  dashboardId: string,
  input: DashboardLayoutRecord,
): Promise<void> {
  const { userId } = await verifySession();
  const [owned] = await db
    .select({ id: dashboard.id })
    .from(dashboard)
    .where(and(eq(dashboard.id, dashboardId), eq(dashboard.userId, userId)))
    .limit(1);
  if (!owned) throw new Error("Forbidden");

  await db
    .insert(dashboardLayout)
    .values({
      dashboardId,
      layout: input.layout,
      instances: input.instances,
      locked: input.locked,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: dashboardLayout.dashboardId,
      set: {
        layout: input.layout,
        instances: input.instances,
        locked: input.locked,
        updatedAt: new Date(),
      },
    });
}
