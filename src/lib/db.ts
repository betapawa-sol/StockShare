import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Next.js dev-mode hot reload creates a new module scope per request; cache the
// client on `globalThis` so we don't exhaust the Postgres connection pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // Prefer a pooled connection at runtime (e.g. Supabase's POSTGRES_PRISMA_URL,
  // PgBouncer/Supavisor) — each concurrent serverless invocation opens its own
  // connection, and an unpooled Postgres exhausts its connection limit fast.
  // DATABASE_URL (direct/non-pooled — see prisma.config.ts) is the fallback for
  // setups with no separate pooler, e.g. local dev.
  const connectionString = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set.");

  // Managed poolers (Supabase's Supavisor, etc.) commonly present a certificate
  // chain that isn't in Node's default trust store even with sslmode=require —
  // node-postgres now treats that mode as full verification, which then fails
  // with "self-signed certificate in certificate chain". Passing a separate
  // `ssl` option to PrismaPg does NOT fix this: node-postgres's own
  // ConnectionParameters always re-parses `connectionString` last and
  // overwrites any explicit `ssl` field with what the string's `sslmode`
  // implies. Rewriting `sslmode=require` to `sslmode=no-verify` instead keeps
  // the connection encrypted but skips chain verification, and survives that
  // parsing (pg-connection-string bakes it straight into the parsed config).
  const relaxedConnectionString = connectionString.replace(/sslmode=require\b/, "sslmode=no-verify");
  const adapter = new PrismaPg({ connectionString: relaxedConnectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
