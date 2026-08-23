import { NGX_TICKERS } from "@/lib/market/tickers";
import { seededRng, gaussian } from "@/lib/market/prng";
import type { DataProvider, DailyBar, StockInfo } from "@/lib/market/types";

// First trading day of the synthetic series. Every ticker's price walk is derived
// deterministically from this epoch, so calling fetchDailyBars for the same date
// always returns the same numbers (needed for idempotent ingestion + believable charts).
const EPOCH = Date.UTC(2025, 0, 2);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isWeekday(date: Date): boolean {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

/** 0-based index of `date` among trading days since EPOCH (inclusive). */
function tradingDayIndex(date: Date): number {
  let index = -1;
  for (let t = EPOCH; t <= Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()); t += MS_PER_DAY) {
    const d = new Date(t);
    if (isWeekday(d)) index += 1;
  }
  return index;
}

// Per-symbol memoized close-price series so repeated calls within a process don't
// recompute the whole random walk from scratch every time.
const closeSeriesCache = new Map<string, number[]>();

function closesUpTo(symbol: string, basePrice: number, index: number): number[] {
  let series = closeSeriesCache.get(symbol);
  if (!series) {
    series = [];
    closeSeriesCache.set(symbol, series);
  }
  if (series.length > index) return series;

  const rng = seededRng(symbol);
  // Fast-forward the RNG stream to just after where we left off.
  for (let i = 0; i < series.length; i++) gaussian(rng);

  let price = series.length > 0 ? series[series.length - 1] : basePrice;
  const drift = 0.0002; // slight upward drift, typical of nominal-price indices
  const dailyVol = 0.018; // ~1.8% daily stdev — broadly representative of NGX large/mid caps

  for (let i = series.length; i <= index; i++) {
    const r = drift + dailyVol * gaussian(rng);
    price = Math.max(0.5, price * (1 + r));
    series.push(Number(price.toFixed(2)));
  }
  return series;
}

export class SeedDataProvider implements DataProvider {
  readonly id = "seed";

  async listStocks(): Promise<StockInfo[]> {
    return NGX_TICKERS.map(({ symbol, name, sector }) => ({ symbol, name, sector }));
  }

  async fetchDailyBars(date: Date): Promise<DailyBar[]> {
    if (!isWeekday(date)) return [];
    const index = tradingDayIndex(date);
    if (index < 0) return [];

    return NGX_TICKERS.map((ticker) => {
      const closes = closesUpTo(ticker.symbol, ticker.basePrice, index);
      const close = closes[index];
      const prevClose = index > 0 ? closes[index - 1] : ticker.basePrice;

      const intrabarRng = seededRng(`${ticker.symbol}-${date.toISOString().slice(0, 10)}-ohlc`);
      const open = Number((prevClose * (1 + (intrabarRng() - 0.5) * 0.01)).toFixed(2));
      const swing = Math.abs(close - open) + close * 0.006;
      const high = Number((Math.max(open, close) + swing * intrabarRng()).toFixed(2));
      const low = Number((Math.min(open, close) - swing * intrabarRng()).toFixed(2));

      const liquidityTier = ticker.basePrice > 500 ? 400_000 : 3_000_000;
      const volume = Math.round(liquidityTier * (0.3 + intrabarRng() * 1.4));

      return {
        symbol: ticker.symbol,
        open,
        high: Math.max(high, open, close),
        low: Math.max(0.5, Math.min(low, open, close)),
        close,
        volume,
      };
    });
  }
}
