// Simple, explainable trend-following model — an SMA-crossover + short-term
// momentum blend. This is a deliberately transparent starting point (no ML
// dependency, runs in milliseconds, easy to reason about) rather than a claim
// of real predictive edge; swap in a proper model later without touching callers,
// since everything downstream only depends on this function's return shape.

export type Signal = "BUY" | "HOLD" | "SELL";

export type TrendPrediction = {
  signal: Signal;
  score: number; // -1 (strong sell) .. 1 (strong buy)
  method: "sma-momentum-v1";
  rationale: string;
};

const SHORT_WINDOW = 5;
const LONG_WINDOW = 20;
const MOMENTUM_WINDOW = 5;
const BUY_THRESHOLD = 0.15;
const SELL_THRESHOLD = -0.15;

function sma(closes: number[], window: number): number | null {
  if (closes.length < window) return null;
  const slice = closes.slice(-window);
  return slice.reduce((sum, c) => sum + c, 0) / window;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * @param closesAscending closing prices ordered oldest → newest, most recent last.
 */
export function computeTrendSignal(closesAscending: number[]): TrendPrediction {
  const latest = closesAscending.at(-1);

  if (!latest || closesAscending.length < LONG_WINDOW) {
    return {
      signal: "HOLD",
      score: 0,
      method: "sma-momentum-v1",
      rationale: `Not enough price history yet (need ${LONG_WINDOW} trading days, have ${closesAscending.length}).`,
    };
  }

  const shortSma = sma(closesAscending, SHORT_WINDOW)!;
  const longSma = sma(closesAscending, LONG_WINDOW)!;
  const momentumBase = closesAscending.at(-1 - MOMENTUM_WINDOW) ?? closesAscending[0];

  const trendComponent = (shortSma - longSma) / longSma;
  const momentumComponent = (latest - momentumBase) / momentumBase;

  const raw = 0.6 * trendComponent + 0.4 * momentumComponent;
  const score = Number(clamp(raw * 8, -1, 1).toFixed(3));

  let signal: Signal = "HOLD";
  if (score >= BUY_THRESHOLD) signal = "BUY";
  else if (score <= SELL_THRESHOLD) signal = "SELL";

  const trendDirection = shortSma >= longSma ? "above" : "below";
  const momentumPct = (momentumComponent * 100).toFixed(1);

  const rationale =
    `${SHORT_WINDOW}-day average (₦${shortSma.toFixed(2)}) is ${trendDirection} the ` +
    `${LONG_WINDOW}-day average (₦${longSma.toFixed(2)}); price is ${momentumPct}% over the last ` +
    `${MOMENTUM_WINDOW} sessions.`;

  return { signal, score, method: "sma-momentum-v1", rationale };
}
