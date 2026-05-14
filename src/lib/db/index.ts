import "server-only";

import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { Pool } from "@neondatabase/serverless";
import postgres from "postgres";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export const db =
  process.env.NODE_ENV === "production"
    ? drizzleNeon(new Pool({ connectionString: databaseUrl }), { schema })
    : drizzlePg(postgres(databaseUrl), { schema });
