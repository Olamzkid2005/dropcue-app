import { readFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DB_URL is required. Use the Supabase CLI or provide the database connection string."
  );
}

async function main() {
  const migrationPath = process.argv[2];
  if (!migrationPath) {
    throw new Error("Provide one migration path, for example supabase/migrations/007_atomic_order_fulfillment.sql");
  }

  const sql = readFileSync(resolve(migrationPath), "utf8");
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log(`Applied migration: ${migrationPath}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
});
