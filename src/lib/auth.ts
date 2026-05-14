import "server-only";

import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      mapProfileToUser: (profile) => ({
        email:
          profile.email ??
          `${profile.id}+${profile.login}@users.noreply.github.com`,
      }),
    },
  },
  user: {
    additionalFields: {
      isAdmin: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (userData) => {
          const email = userData.email.toLowerCase().trim();

          const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(schema.user);

          if (count === 0) {
            return {
              data: { ...userData, email, isAdmin: true },
            };
          }

          const [allowed] = await db
            .select()
            .from(schema.allowedEmail)
            .where(eq(schema.allowedEmail.email, email))
            .limit(1);

          if (!allowed) {
            throw new APIError("FORBIDDEN", {
              message: "This email is not permitted to sign up.",
            });
          }

          return {
            data: { ...userData, email, isAdmin: allowed.isAdmin },
          };
        },
      },
    },
  },
});
