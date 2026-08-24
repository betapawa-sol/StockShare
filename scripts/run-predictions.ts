import "dotenv/config";
import { snapshotTodaysPredictions } from "@/lib/market/predictions-job";

// Snapshots today's trend signal for every stock into the Prediction table, so
// signal history can be charted/audited later (see /stocks/[symbol]).
// Run daily after `npm run ingest` (e.g. from the same cron job).
async function main() {
  const { date, written } = await snapshotTodaysPredictions();
  console.log(`Wrote ${written} prediction snapshots for ${date.toDateString()}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
