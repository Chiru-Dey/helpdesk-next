import { connect } from "@tidbcloud/serverless";
import { drizzle } from "drizzle-orm/tidb-serverless";
import { relations } from "./relations";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill in your TiDB Cloud connection string.",
  );
}

const client = connect({ url: databaseUrl });

// In Drizzle v1 RC, we pass `relations` instead of `schema`.
// The `mode` parameter is removed — no longer needed.
export const db = drizzle({ client, relations });