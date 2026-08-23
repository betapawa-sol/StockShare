import { SeedDataProvider } from "@/lib/market/providers/seed-provider";
import { NgxScraperProvider } from "@/lib/market/providers/ngx-scraper-provider";
import type { DataProvider } from "@/lib/market/types";

/**
 * MARKET_DATA_PROVIDER=scrape attempts to scrape NGX's public price list (see
 * ngx-scraper-provider.ts for caveats). Defaults to the deterministic seed
 * provider, which is what local dev and the demo dataset use.
 */
export function getDataProvider(): DataProvider {
  const mode = process.env.MARKET_DATA_PROVIDER ?? "seed";
  if (mode === "scrape") return new NgxScraperProvider();
  return new SeedDataProvider();
}
