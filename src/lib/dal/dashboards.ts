import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { dashboard } from "@/lib/db/schema";

import { verifySession } from "./session";

export interface DashboardRecord {
  id: string;
  name: string;
  type: "widgets" | "custom";
  order: number;
}

export async function listDashboards(): Promise<DashboardRecord[]> {
  const { userId } = await verifySession();
  const rows = await db
    .select({
      id: dashboard.id,
      name: dashboard.name,
      type: dashboard.type,
      order: dashboard.order,
    })
    .from(dashboard)
    .where(eq(dashboard.userId, userId))
    .orderBy(asc(dashboard.order));
  return rows as DashboardRecord[];
}

export async function createDashboard(
  id: string,
  name: string,
  type: string,
  order: number,
): Promise<void> {
  const { userId } = await verifySession();
  await db.insert(dashboard).values({ id, userId, name, type, order });
}

export async function renameDashboard(id: string, name: string): Promise<void> {
  const { userId } = await verifySession();
  await db
    .update(dashboard)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(dashboard.id, id), eq(dashboard.userId, userId)));
}

export async function deleteDashboard(id: string): Promise<void> {
  const { userId } = await verifySession();
  await db
    .delete(dashboard)
    .where(and(eq(dashboard.id, id), eq(dashboard.userId, userId)));
}
