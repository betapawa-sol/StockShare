import * as cheerio from "cheerio";
import { NGX_TICKERS } from "@/lib/market/tickers";
import type { DataProvider, DailyBar, StockInfo } from "@/lib/market/types";

/**
 * Best-effort scraper for NGX's public equities price list.
 *
 * IMPORTANT — not verified against the live page: this was built in a sandboxed
 * environment with no network access to ngxgroup.com (egress was blocked), so the
 * table/column detection below is written defensively (it looks for header text
 * rather than hard-coded column indexes) but has not been run against the real
 * HTML. Before relying on this in production:
 *   1. Set NGX_SOURCE_URL if the default page has moved.
 *   2. Run `npm run ingest -- --provider=scrape` and check the output/error.
 *   3. If it throws "could not locate a price table", inspect the page's HTML
 *      and adjust `findPriceTable` / `HEADER_ALIASES` below to match.
 *
 * The official real-time/EOD feed is a paid product (marketdataapiv3.ngxgroup.com);
 * this scraper targets the free public price-list page instead, which is more
 * likely to change shape without notice — treat failures here as expected
 * maintenance, not a bug in the surrounding app. The ingestion script
 * (scripts/ingest-daily-prices.ts) falls back to SeedDataProvider automatically
 * if this throws.
 */

const DEFAULT_SOURCE_URL = "https://ngxgroup.com/exchange/data/equities-price-list/";

const HEADER_ALIASES: Record<string, string[]> = {
  symbol: ["symbol", "ticker", "security"],
  close: ["close", "closing price", "price", "last"],
  open: ["open", "opening price"],
  high: ["high"],
  low: ["low"],
  volume: ["volume", "traded volume", "quantity traded"],
  change: ["change", "gain/loss", "price change"],
};

const KNOWN_SYMBOLS = new Set(NGX_TICKERS.map((t) => t.symbol.toUpperCase()));

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function toNumber(text: string): number | null {
  const cleaned = text.replace(/[,%₦\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  if (!cleaned || cleaned === "-") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

type ColumnMap = Partial<Record<keyof typeof HEADER_ALIASES, number>>;

function matchHeaderColumns(headerCells: string[]): ColumnMap | null {
  const map: ColumnMap = {};
  headerCells.forEach((raw, index) => {
    const cell = normalize(raw);
    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((alias) => cell === alias || cell.includes(alias))) {
        map[key as keyof typeof HEADER_ALIASES] ??= index;
      }
    }
  });
  return map.symbol !== undefined && map.close !== undefined ? map : null;
}

function findPriceTable($: cheerio.CheerioAPI): { table: cheerio.Cheerio<import("domhandler").Element>; columns: ColumnMap } | null {
  const tables = $("table").toArray();
  for (const table of tables) {
    const $table = $(table);
    const headerCells = $table
      .find("thead tr th, tr:first-child th, tr:first-child td")
      .map((_, el) => $(el).text())
      .get();
    const columns = matchHeaderColumns(headerCells);
    if (columns) return { table: $table, columns };
  }
  return null;
}

export class NgxScraperProvider implements DataProvider {
  readonly id = "ngx-scrape";
  private readonly sourceUrl: string;

  constructor(sourceUrl: string = process.env.NGX_SOURCE_URL ?? DEFAULT_SOURCE_URL) {
    this.sourceUrl = sourceUrl;
  }

  async listStocks(): Promise<StockInfo[]> {
    return NGX_TICKERS.map(({ symbol, name, sector }) => ({ symbol, name, sector }));
  }

  // `date` is unused: the public price list page only ever exposes the latest
  // session, with no documented way to request a specific historical date.
  async fetchDailyBars(_date: Date): Promise<DailyBar[]> {
    const res = await fetch(this.sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StockShareBot/1.0)" },
      // The public price list only ever shows the latest session; there's no
      // documented way to request historical dates from this page.
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`NGX scrape failed: HTTP ${res.status} fetching ${this.sourceUrl}`);
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const found = findPriceTable($);
    if (!found) {
      throw new Error(
        "NGX scrape failed: could not locate a price table on the page. The page structure likely " +
          "changed — inspect the HTML and update HEADER_ALIASES/findPriceTable in ngx-scraper-provider.ts.",
      );
    }

    const { table, columns } = found;
    const bars: DailyBar[] = [];

    table
      .find("tbody tr")
      .toArray()
      .forEach((row) => {
        const cells = $(row)
          .find("td")
          .map((_, el) => $(el).text())
          .get();
        if (cells.length === 0) return;

        const symbol = cells[columns.symbol!]?.trim().toUpperCase();
        if (!symbol || !KNOWN_SYMBOLS.has(symbol)) return;

        const close = columns.close !== undefined ? toNumber(cells[columns.close]) : null;
        if (close === null) return;

        const open = columns.open !== undefined ? toNumber(cells[columns.open]) ?? close : close;
        const high = columns.high !== undefined ? toNumber(cells[columns.high]) ?? close : close;
        const low = columns.low !== undefined ? toNumber(cells[columns.low]) ?? close : close;
        const volume = columns.volume !== undefined ? toNumber(cells[columns.volume]) ?? 0 : 0;

        bars.push({ symbol, open, high, low, close, volume });
      });

    if (bars.length < 5) {
      throw new Error(
        `NGX scrape failed: only matched ${bars.length} known tickers in the table — the page layout ` +
          "likely doesn't match HEADER_ALIASES. Falling back to seed data upstream.",
      );
    }

    return bars;
  }
}
