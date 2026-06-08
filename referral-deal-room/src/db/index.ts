/**
 * Database client. Uses postgres.js (works against Neon's standard Postgres
 * endpoint and supports transactions, which the seed + multi-step mutations
 * need). All DB access runs in the Node.js runtime, never Edge.
 *
 * For tenant isolation we rely on rigorous query-layer scoping (see
 * `src/lib/tenant.ts`). The optional RLS migration adds defense-in-depth.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse the client across hot-reloads in dev to avoid exhausting connections.
const globalForDb = globalThis as unknown as {
  __pg?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__pg ??
  postgres(connectionString, {
    max: 10,
    prepare: false, // required for transaction-mode poolers (Neon pooled)
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pg = client;
}

export const db = drizzle(client, {
  schema: { ...schema, ...relations },
  casing: "snake_case",
});

export type Database = typeof db;
export { schema };
