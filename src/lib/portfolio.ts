import { prisma } from "@/lib/db";
import { getAllStocksWithSignals, type StockWithSignal } from "@/lib/market/queries";

export type HoldingView = {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  costBasis: number;
  marketValue: number;
  gainLoss: number;
  gainLossPct: number;
  signal: StockWithSignal["prediction"]["signal"];
};

export type PortfolioSummary = {
  holdings: HoldingView[];
  totalCost: number;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPct: number;
};

export async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
  const [holdings, signals] = await Promise.all([
    prisma.holding.findMany({ where: { userId }, include: { stock: true }, orderBy: { createdAt: "asc" } }),
    getAllStocksWithSignals(),
  ]);
  const signalBySymbol = new Map(signals.map((s) => [s.symbol, s]));

  const views: HoldingView[] = holdings.map((holding) => {
    const signal = signalBySymbol.get(holding.stock.symbol);
    const currentPrice = signal?.latest?.close ?? holding.averageCost;
    const costBasis = holding.averageCost * holding.quantity;
    const marketValue = currentPrice * holding.quantity;
    const gainLoss = marketValue - costBasis;
    return {
      id: holding.id,
      symbol: holding.stock.symbol,
      name: holding.stock.name,
      sector: holding.stock.sector,
      quantity: holding.quantity,
      averageCost: holding.averageCost,
      currentPrice,
      costBasis,
      marketValue,
      gainLoss,
      gainLossPct: costBasis !== 0 ? (gainLoss / costBasis) * 100 : 0,
      signal: signal?.prediction.signal ?? "HOLD",
    };
  });

  const totalCost = views.reduce((sum, v) => sum + v.costBasis, 0);
  const totalValue = views.reduce((sum, v) => sum + v.marketValue, 0);
  const totalGainLoss = totalValue - totalCost;

  return {
    holdings: views,
    totalCost,
    totalValue,
    totalGainLoss,
    totalGainLossPct: totalCost !== 0 ? (totalGainLoss / totalCost) * 100 : 0,
  };
}

/** Snapshots today's total portfolio value/cost so performance can be charted over time. */
export async function recordPortfolioSnapshot(userId: string) {
  const { totalValue, totalCost, totalGainLoss, totalGainLossPct } = await getPortfolioSummary(userId);
  const today = new Date();
  const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  return prisma.portfolioSnapshot.upsert({
    where: { userId_date: { userId, date: day } },
    update: { totalValue, totalCost, gainLoss: totalGainLoss, gainLossPct: totalGainLossPct },
    create: { userId, date: day, totalValue, totalCost, gainLoss: totalGainLoss, gainLossPct: totalGainLossPct },
  });
}

export async function getPortfolioHistory(userId: string) {
  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });
  return snapshots.map((s) => ({ date: s.date.toISOString().slice(0, 10), close: s.totalValue }));
}
