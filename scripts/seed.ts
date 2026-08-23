import "dotenv/config";
import { backfillDailyPrices } from "@/lib/market/ingest";
import { SeedDataProvider } from "@/lib/market/providers/seed-provider";

// One-shot setup for a fresh clone: ~180 calendar days of deterministic seed
// price history for every tracked NGX ticker. Run predictions separately with
// `npm run predict` once prices exist.
async function main() {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 180);

  console.log(`Seeding ~180 days of NGX demo price history (${from.toDateString()} → ${to.toDateString()})…`);
  const results = await backfillDailyPrices(from, to, new SeedDataProvider());
  const totalWritten = results.reduce((sum, r) => sum + r.pricesWritten, 0);
  console.log(`Done: ${results.length} trading days, ${totalWritten} price rows written across 24 tickers.`);
  console.log("Run `npm run predict` next to snapshot today's trend signals.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
