import "dotenv/config";
import { ingestDailyPrices, backfillDailyPrices } from "@/lib/market/ingest";
import { SeedDataProvider } from "@/lib/market/providers/seed-provider";
import { getDataProvider } from "@/lib/market/provider";

// Usage:
//   npm run ingest                         ingest today with MARKET_DATA_PROVIDER (default: seed)
//   npm run ingest -- --backfill=120       backfill the last N trading days (seed only, for demo data)
//   npm run ingest -- --provider=scrape    force the NGX scraper for this run
async function main() {
  const args = new Map(
    process.argv.slice(2).map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key, value ?? "true"];
    }),
  );

  if (args.has("provider")) {
    process.env.MARKET_DATA_PROVIDER = args.get("provider");
  }

  if (args.has("backfill")) {
    const days = Number(args.get("backfill")) || 120;
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - days);
    console.log(`Backfilling ~${days} calendar days of seed data (${from.toDateString()} → ${to.toDateString()})…`);
    const results = await backfillDailyPrices(from, to, new SeedDataProvider());
    const totalWritten = results.reduce((sum, r) => sum + r.pricesWritten, 0);
    console.log(`Backfill complete: ${results.length} trading days, ${totalWritten} price rows written.`);
    return;
  }

  const provider = getDataProvider();
  console.log(`Ingesting today's prices via provider "${provider.id}"…`);
  try {
    const result = await ingestDailyPrices(new Date(), provider);
    console.log(`Ingested ${result.pricesWritten}/${result.barsFetched} bars for ${result.date.toDateString()}.`);
  } catch (error) {
    if (provider.id === "ngx-scrape") {
      console.error(`Scraper failed: ${(error as Error).message}`);
      console.log("Falling back to seed data provider for this run.");
      const result = await ingestDailyPrices(new Date(), new SeedDataProvider());
      console.log(`Ingested ${result.pricesWritten}/${result.barsFetched} bars (seed fallback).`);
      return;
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
