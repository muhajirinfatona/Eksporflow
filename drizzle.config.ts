import { defineConfig } from "drizzle-kit";

// `drizzle-kit generate` hanya membaca schema dan tidak membutuhkan koneksi database;
// perintah lain (migrate, push, studio) wajib memakai DATABASE_URL.
const connectionString = process.env.DATABASE_URL;
const needsConnection = !process.argv.includes("generate");
if (!connectionString && needsConnection) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString ?? "postgresql://placeholder@localhost:5432/placeholder",
  },
});
