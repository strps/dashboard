"use server";

import { revalidatePath } from "next/cache";

import {
  type AllowedEmailRecord,
  addAllowedEmail,
  listAllowedEmails,
  removeAllowedEmail,
  setAllowedEmailAdmin,
} from "@/lib/dal/allowedEmails";

export async function listAllowedEmailsAction(): Promise<AllowedEmailRecord[]> {
  return listAllowedEmails();
}

export async function addAllowedEmailAction(
  email: string,
  isAdmin: boolean,
): Promise<AllowedEmailRecord> {
  const row = await addAllowedEmail(email, isAdmin);
  revalidatePath("/settings/security");
  return row;
}

export async function removeAllowedEmailAction(email: string): Promise<void> {
  await removeAllowedEmail(email);
  revalidatePath("/settings/security");
}

export async function setAllowedEmailAdminAction(
  email: string,
  isAdmin: boolean,
): Promise<void> {
  await setAllowedEmailAdmin(email, isAdmin);
  revalidatePath("/settings/security");
}
