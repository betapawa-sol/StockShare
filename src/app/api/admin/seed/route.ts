import { NextRequest, NextResponse } from "next/server";
import { backfillDailyPrices, ingestDailyPrices } from "@/lib/market/ingest";
import { SeedDataProvider } from "@/lib/market/providers/seed-provider";
import { NgxScraperProvider } from "@/lib/market/providers/ngx-scraper-provider";
import { snapshotTodaysPredictions } from "@/lib/market/predictions-job";

// One-time admin endpoint to populate a fresh (empty) production database.
// Protected by a shared secret since it's a write; safe to call repeatedly
// (everything it does is an idempotent upsert) but not meant to stay in
// regular use — daily ingestion should run via `npm run ingest` on a
// schedule (Vercel Cron / GitHub Action) instead, see README.
//
// Usage: GET /api/admin/seed?secret=<ADMIN_SECRET>
export async function GET(request: NextRequest) {
  const expected = process.env.ADMIN_SECRET;
  const provided = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-admin-secret");

  if (!expected) {
    return NextResponse.json({ error: "ADMIN_SECRET is not configured on the server." }, { status: 501 });
  }
  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 180);

  const backfillResults = await backfillDailyPrices(from, to, new SeedDataProvider());
  const pricesWritten = backfillResults.reduce((sum, r) => sum + r.pricesWritten, 0);

  // Best-effort: try to overwrite today's bar with a real pull from NGX's
  // public price list. Falls back silently to the seed data already written
  // above if the scraper can't parse the page (see ngx-scraper-provider.ts).
  type LiveScrapeResult = { attempted: true; success: boolean; pricesWritten?: number; error?: string };
  let liveScrape: LiveScrapeResult;
  try {
    const result = await ingestDailyPrices(new Date(), new NgxScraperProvider());
    liveScrape = { attempted: true, success: true, pricesWritten: result.pricesWritten };
  } catch (error) {
    liveScrape = { attempted: true, success: false, error: error instanceof Error ? error.message : String(error) };
  }

  const predictions = await snapshotTodaysPredictions();

  return NextResponse.json({
    backfill: { tradingDays: backfillResults.length, pricesWritten },
    liveScrape,
    predictions,
  });
}
