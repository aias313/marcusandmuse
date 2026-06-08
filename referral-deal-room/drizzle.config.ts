import { defineConfig } from "drizzle-kit";
import "dotenv/config";

// Migrations and schema introspection use the *unpooled* connection when
// available (drizzle-kit opens long-lived sessions that don't play well with
// transaction-mode poolers like PgBouncer/Neon pooled endpoints).
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL (or DATABASE_URL_UNPOOLED) must be set");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: { url },
  casing: "snake_case",
  verbose: true,
  strict: true,
});
