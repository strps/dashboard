import "server-only";

import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export const db =
  process.env.NODE_ENV === "production"
    ? drizzleNeon(neon(databaseUrl), { schema })
    : drizzlePg(postgres(databaseUrl), { schema });
