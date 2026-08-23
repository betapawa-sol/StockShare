import "dotenv/config";
import { prisma } from "@/lib/db";
import { computeTrendSignal } from "@/lib/prediction";

// Snapshots today's trend signal for every stock into the Prediction table, so
// signal history can be charted/audited later (see /stocks/[symbol]).
// Run daily after `npm run ingest` (e.g. from the same cron job).
async function main() {
  const stocks = await prisma.stock.findMany();
  const today = new Date();
  const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  let written = 0;
  for (const stock of stocks) {
    const history = await prisma.dailyPrice.findMany({
      where: { stockId: stock.id },
      orderBy: { date: "desc" },
      take: 40,
    });
    if (history.length === 0) continue;
    const closes = history.reverse().map((h) => h.close);
    const prediction = computeTrendSignal(closes);

    await prisma.prediction.upsert({
      where: { stockId_date: { stockId: stock.id, date: day } },
      update: prediction,
      create: { stockId: stock.id, date: day, ...prediction },
    });
    written += 1;
  }

  console.log(`Wrote ${written} prediction snapshots for ${day.toDateString()}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
