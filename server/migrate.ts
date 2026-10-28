import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

function normalizeDatabaseUrl(raw: string): string {
  try {
    const parsed = new URL(raw);
    parsed.searchParams.delete("pgbouncer");
    return parsed.toString();
  } catch {
    return raw;
  }
}

function isLocalDatabase(connectionString: string): boolean {
  try {
    return ["localhost", "127.0.0.1", "::1"].includes(new URL(connectionString).hostname);
  } catch {
    return false;
  }
}

async function runMigrations() {
  const rawUrl = process.env.DATABASE_URL?.trim();

  if (!rawUrl) {
    console.error(
      "\n[EksporFlow] DATABASE_URL masih kosong di file D:\\Eksporflow\\.env.\n" +
        "Silakan tempel Connection String PostgreSQL dari Supabase (Connect -> Transaction pooler port 6543) ke variabel DATABASE_URL.\n",
    );
    process.exit(1);
  }

  if (rawUrl.includes("[YOUR-PASSWORD]") || rawUrl.includes("PROJECT_REF")) {
    console.error(
      "\n[EksporFlow] DATABASE_URL di .env masih berisi teks contoh ([YOUR-PASSWORD] / PROJECT_REF).\n" +
        "Pastikan Anda mengganti [YOUR-PASSWORD] dengan password database Supabase asli Anda (tanpa tanda kurung siku []).\n",
    );
    process.exit(1);
  }

  const connectionString = normalizeDatabaseUrl(rawUrl);

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = path.resolve(currentDir, "../drizzle/migrations");

  console.log("[EksporFlow] Menghubungkan ke PostgreSQL / Supabase...");
  const client = postgres(connectionString, {
    max: 1,
    prepare: false,
    ssl: isLocalDatabase(connectionString) ? false : "require",
  });

  try {
    const db = drizzle(client);
    await migrate(db, { migrationsFolder });
    console.log(
      "✅ [EksporFlow] Migrasi selesai! Seluruh 6 tabel beserta Row Level Security (RLS) sudah siap di database Anda.",
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

runMigrations().catch((error) => {
  console.error("\n❌ [EksporFlow] Migrasi database gagal:", error instanceof Error ? error.message : error);
  process.exit(1);
});
