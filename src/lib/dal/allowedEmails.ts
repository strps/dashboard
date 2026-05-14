import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { allowedEmail } from "@/lib/db/schema";

import { verifyAdmin } from "./session";

export interface AllowedEmailRecord {
  email: string;
  isAdmin: boolean;
  createdAt: Date;
}

export async function listAllowedEmails(): Promise<AllowedEmailRecord[]> {
  await verifyAdmin();
  const rows = await db
    .select({
      email: allowedEmail.email,
      isAdmin: allowedEmail.isAdmin,
      createdAt: allowedEmail.createdAt,
    })
    .from(allowedEmail)
    .orderBy(asc(allowedEmail.createdAt));
  return rows;
}

export async function addAllowedEmail(
  rawEmail: string,
  isAdmin: boolean,
): Promise<AllowedEmailRecord> {
  const { userId } = await verifyAdmin();
  const email = rawEmail.toLowerCase().trim();
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email address");
  }
  await db
    .insert(allowedEmail)
    .values({ email, isAdmin, addedByUserId: userId })
    .onConflictDoUpdate({
      target: allowedEmail.email,
      set: { isAdmin },
    });
  const [row] = await db
    .select({
      email: allowedEmail.email,
      isAdmin: allowedEmail.isAdmin,
      createdAt: allowedEmail.createdAt,
    })
    .from(allowedEmail)
    .where(eq(allowedEmail.email, email))
    .limit(1);
  return row;
}

export async function removeAllowedEmail(rawEmail: string): Promise<void> {
  await verifyAdmin();
  const email = rawEmail.toLowerCase().trim();
  await db.delete(allowedEmail).where(eq(allowedEmail.email, email));
}

export async function setAllowedEmailAdmin(
  rawEmail: string,
  isAdmin: boolean,
): Promise<void> {
  await verifyAdmin();
  const email = rawEmail.toLowerCase().trim();
  await db
    .update(allowedEmail)
    .set({ isAdmin })
    .where(eq(allowedEmail.email, email));
}
