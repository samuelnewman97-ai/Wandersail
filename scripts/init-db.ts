import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Run via: npx dotenv -e .env.local -- npx tsx scripts/init-db.ts"
    );
    process.exit(1);
  }
  const sql = neon(url);
  await sql`
    CREATE TABLE IF NOT EXISTS wandersail_state (
      id int PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ wandersail_state table ready");
}

main().catch((err) => {
  console.error("init-db failed:", err);
  process.exit(1);
});
