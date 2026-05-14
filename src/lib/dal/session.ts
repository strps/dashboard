import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

export async function verifySession(): Promise<{
  userId: string;
  isAdmin: boolean;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new UnauthorizedError();
  const isAdmin =
    (session.user as { isAdmin?: boolean | null }).isAdmin === true;
  return { userId: session.user.id, isAdmin };
}

export async function verifyAdmin(): Promise<{ userId: string }> {
  const { userId, isAdmin } = await verifySession();
  if (!isAdmin) throw new ForbiddenError();
  return { userId };
}
