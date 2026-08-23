import { prisma } from "@/lib/db";
import { computeTrendSignal, type TrendPrediction } from "@/lib/prediction";

const HISTORY_WINDOW = 40;

export type StockWithSignal = {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  latest: {
    date: Date;
    close: number;
    change: number;
    changePercent: number;
    volume: number;
  } | null;
  prediction: TrendPrediction;
};

async function priceHistoryFor(stockId: string, limit = HISTORY_WINDOW) {
  const rows = await prisma.dailyPrice.findMany({
    where: { stockId },
    orderBy: { date: "desc" },
    take: limit,
  });
  return rows.reverse(); // oldest -> newest
}

export async function getStockWithSignal(symbol: string): Promise<StockWithSignal | null> {
  const stock = await prisma.stock.findUnique({ where: { symbol } });
  if (!stock) return null;

  const history = await priceHistoryFor(stock.id);
  const latestRow = history.at(-1) ?? null;

  return {
    id: stock.id,
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    latest: latestRow && {
      date: latestRow.date,
      close: latestRow.close,
      change: latestRow.change,
      changePercent: latestRow.changePercent,
      volume: latestRow.volume,
    },
    prediction: computeTrendSignal(history.map((h) => h.close)),
  };
}

export async function getAllStocksWithSignals(): Promise<StockWithSignal[]> {
  const stocks = await prisma.stock.findMany({ orderBy: { symbol: "asc" } });

  return Promise.all(
    stocks.map(async (stock) => {
      const history = await priceHistoryFor(stock.id);
      const latestRow = history.at(-1) ?? null;
      return {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        latest: latestRow && {
          date: latestRow.date,
          close: latestRow.close,
          change: latestRow.change,
          changePercent: latestRow.changePercent,
          volume: latestRow.volume,
        },
        prediction: computeTrendSignal(history.map((h) => h.close)),
      };
    }),
  );
}

export async function getPriceHistoryForChart(symbol: string, days = HISTORY_WINDOW) {
  const stock = await prisma.stock.findUnique({ where: { symbol } });
  if (!stock) return [];
  const history = await priceHistoryFor(stock.id, days);
  return history.map((h) => ({
    date: h.date.toISOString().slice(0, 10),
    close: h.close,
    volume: h.volume,
  }));
}
