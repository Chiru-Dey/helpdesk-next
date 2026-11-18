import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill in your TiDB Cloud connection string.",
  );
}

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: databaseUrl,
    // Explicitly request SSL for the local mysql2 client used by drizzle-kit
    ssl: {
      rejectUnauthorized: true,
    },
  },
});