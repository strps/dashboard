import "server-only";

import { eq } from "drizzle-orm";
import type { LayoutItem } from "react-grid-layout";

import { db } from "@/lib/db";
import { dashboardLayout } from "@/lib/db/schema";

import { verifySession } from "./session";

export interface DashboardLayoutRecord {
  layout: LayoutItem[];
  instances: { id: string; type: string; config?: unknown }[];
  locked: boolean;
}

export async function getDashboardLayout(): Promise<DashboardLayoutRecord | null> {
  const { userId } = await verifySession();
  const [row] = await db
    .select()
    .from(dashboardLayout)
    .where(eq(dashboardLayout.userId, userId))
    .limit(1);
  if (!row) return null;
  return { layout: row.layout, instances: row.instances, locked: row.locked };
}

export async function saveDashboardLayout(
  input: DashboardLayoutRecord,
): Promise<void> {
  const { userId } = await verifySession();
  await db
    .insert(dashboardLayout)
    .values({
      userId,
      layout: input.layout,
      instances: input.instances,
      locked: input.locked,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: dashboardLayout.userId,
      set: {
        layout: input.layout,
        instances: input.instances,
        locked: input.locked,
        updatedAt: new Date(),
      },
    });
}
