import { connect } from "@tidbcloud/serverless";
import { drizzle } from "drizzle-orm/tidb-serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill in your TiDB Cloud connection string.",
  );
}

// The official TiDB Serverless driver uses HTTP (Data API),
// which completely bypasses TCP/TLS handshake issues.
const client = connect({ url: databaseUrl });

export const db = drizzle({ client, schema });