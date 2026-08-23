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
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
