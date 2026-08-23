import { prisma } from "@/lib/db";
import { getAllStocksWithSignals, type StockWithSignal } from "@/lib/market/queries";

export type RecommendationKind = "BUY_SIGNAL" | "SELL_SIGNAL" | "DIVERSIFY" | "CONCENTRATION_RISK";

export type RecommendationView = {
  stockSymbol: string;
  stockName: string;
  kind: RecommendationKind;
  reason: string;
};

const CONCENTRATION_THRESHOLD = 0.4; // a single holding above 40% of portfolio value
const SECTOR_CONCENTRATION_THRESHOLD = 0.5; // a single sector above 50% of portfolio value
const OPPORTUNITY_COUNT = 5; // top BUY-signal stocks not already held

export async function generateRecommendations(userId: string): Promise<RecommendationView[]> {
  const [holdings, allSignals] = await Promise.all([
    prisma.holding.findMany({ where: { userId }, include: { stock: true } }),
    getAllStocksWithSignals(),
  ]);

  const signalBySymbol = new Map(allSignals.map((s) => [s.symbol, s]));
  const recs: RecommendationView[] = [];

  // 1. Signal-driven recommendations on what the user already holds.
  const positions = holdings.map((holding) => {
    const signal = signalBySymbol.get(holding.stock.symbol);
    const price = signal?.latest?.close ?? holding.averageCost;
    const value = price * holding.quantity;
    return { holding, signal, value };
  });

  for (const { holding, signal } of positions) {
    if (!signal) continue;
    if (signal.prediction.signal === "SELL") {
      recs.push({
        stockSymbol: holding.stock.symbol,
        stockName: holding.stock.name,
        kind: "SELL_SIGNAL",
        reason: `Your ${holding.quantity.toLocaleString()}-share position is showing a SELL signal: ${signal.prediction.rationale}`,
      });
    } else if (signal.prediction.signal === "BUY") {
      recs.push({
        stockSymbol: holding.stock.symbol,
        stockName: holding.stock.name,
        kind: "BUY_SIGNAL",
        reason: `Trend model favors adding to your existing position: ${signal.prediction.rationale}`,
      });
    }
  }

  // 2. Concentration risk within the portfolio.
  const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
  if (totalValue > 0) {
    for (const { holding, value } of positions) {
      const weight = value / totalValue;
      if (weight >= CONCENTRATION_THRESHOLD) {
        recs.push({
          stockSymbol: holding.stock.symbol,
          stockName: holding.stock.name,
          kind: "CONCENTRATION_RISK",
          reason: `${holding.stock.symbol} makes up ${(weight * 100).toFixed(0)}% of your tracked portfolio value — consider trimming to reduce single-stock risk.`,
        });
      }
    }

    const valueBySector = new Map<string, number>();
    for (const { holding, value } of positions) {
      valueBySector.set(holding.stock.sector, (valueBySector.get(holding.stock.sector) ?? 0) + value);
    }
    for (const [sector, value] of valueBySector) {
      const weight = value / totalValue;
      if (weight >= SECTOR_CONCENTRATION_THRESHOLD) {
        recs.push({
          stockSymbol: "—",
          stockName: sector,
          kind: "DIVERSIFY",
          reason: `${(weight * 100).toFixed(0)}% of your portfolio is in ${sector}. Diversifying into other sectors would reduce exposure to sector-specific swings.`,
        });
      }
    }
  }

  // 3. New opportunities: strongest BUY signals among stocks not already held.
  const heldSymbols = new Set(holdings.map((h) => h.stock.symbol));
  const opportunities = allSignals
    .filter((s): s is StockWithSignal => !heldSymbols.has(s.symbol) && s.prediction.signal === "BUY")
    .sort((a, b) => b.prediction.score - a.prediction.score)
    .slice(0, OPPORTUNITY_COUNT);

  for (const stock of opportunities) {
    recs.push({
      stockSymbol: stock.symbol,
      stockName: stock.name,
      kind: "BUY_SIGNAL",
      reason: `New opportunity: ${stock.prediction.rationale}`,
    });
  }

  return recs;
}
