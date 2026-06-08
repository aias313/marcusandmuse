/**
 * Apply pending Drizzle migrations. Run with: `npm run db:migrate`.
 * Uses a single, unpooled connection (migrations want a stable session).
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL (or DATABASE_URL_UNPOOLED) must be set");
}

const sql = postgres(url, { max: 1 });

async function main() {
  await migrate(drizzle(sql), { migrationsFolder: "./src/db/migrations" });
  console.log("✅ migrations applied");
}

main()
  .catch((err) => {
    console.error("❌ migration failed", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
