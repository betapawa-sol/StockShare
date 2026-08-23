import { prisma } from "@/lib/db";
import { getDataProvider } from "@/lib/market/provider";
import type { DataProvider } from "@/lib/market/types";

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function ensureStocksExist(provider: DataProvider) {
  const stocks = await provider.listStocks();
  await prisma.$transaction(
    stocks.map((stock) =>
      prisma.stock.upsert({
        where: { symbol: stock.symbol },
        update: { name: stock.name, sector: stock.sector },
        create: stock,
      }),
    ),
  );
}

export async function ingestDailyPrices(date: Date, provider: DataProvider = getDataProvider()) {
  const day = startOfUtcDay(date);

  await ensureStocksExist(provider);
  const bars = await provider.fetchDailyBars(day);

  const stocks = await prisma.stock.findMany({
    where: { symbol: { in: bars.map((b) => b.symbol) } },
  });
  const stockBySymbol = new Map(stocks.map((s) => [s.symbol, s]));

  let written = 0;
  for (const bar of bars) {
    const stock = stockBySymbol.get(bar.symbol);
    if (!stock) continue;

    const previous = await prisma.dailyPrice.findFirst({
      where: { stockId: stock.id, date: { lt: day } },
      orderBy: { date: "desc" },
    });
    const prevClose = previous?.close ?? bar.open;
    const change = Number((bar.close - prevClose).toFixed(2));
    const changePercent = prevClose !== 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

    await prisma.dailyPrice.upsert({
      where: { stockId_date: { stockId: stock.id, date: day } },
      update: {
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
        change,
        changePercent,
      },
      create: {
        stockId: stock.id,
        date: day,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
        change,
        changePercent,
      },
    });
    written += 1;
  }

  return { provider: provider.id, date: day, barsFetched: bars.length, pricesWritten: written };
}

/** Ingests each trading day from `from` to `to` (inclusive), inline change calc requires order. */
export async function backfillDailyPrices(from: Date, to: Date, provider: DataProvider = getDataProvider()) {
  const results = [];
  const cursor = startOfUtcDay(from);
  const end = startOfUtcDay(to);
  while (cursor.getTime() <= end.getTime()) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      results.push(await ingestDailyPrices(new Date(cursor), provider));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return results;
}
