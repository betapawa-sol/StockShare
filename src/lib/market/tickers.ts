// Curated set of well-known NGX (Nigerian Exchange) listed equities.
// `basePrice` is an illustrative starting point (NGN) for the seed data walk in
// providers/seed-provider.ts — not a live quote. Real prices come from whichever
// DataProvider is active; see src/lib/market/provider.ts.

export type TickerSeed = {
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
};

export const NGX_TICKERS: TickerSeed[] = [
  { symbol: "DANGCEM", name: "Dangote Cement Plc", sector: "Industrial Goods", basePrice: 420 },
  { symbol: "BUACEMENT", name: "BUA Cement Plc", sector: "Industrial Goods", basePrice: 90 },
  { symbol: "WAPCO", name: "Lafarge Africa Plc", sector: "Industrial Goods", basePrice: 68 },
  { symbol: "MTNN", name: "MTN Nigeria Communications Plc", sector: "Telecommunications", basePrice: 220 },
  { symbol: "AIRTELAFRI", name: "Airtel Africa Plc", sector: "Telecommunications", basePrice: 2100 },
  { symbol: "GTCO", name: "Guaranty Trust Holding Company Plc", sector: "Banking", basePrice: 58 },
  { symbol: "ZENITHBANK", name: "Zenith Bank Plc", sector: "Banking", basePrice: 45 },
  { symbol: "ACCESSCORP", name: "Access Holdings Plc", sector: "Banking", basePrice: 24 },
  { symbol: "UBA", name: "United Bank for Africa Plc", sector: "Banking", basePrice: 30 },
  { symbol: "FBNH", name: "FBN Holdings Plc", sector: "Banking", basePrice: 32 },
  { symbol: "STANBIC", name: "Stanbic IBTC Holdings Plc", sector: "Banking", basePrice: 78 },
  { symbol: "SEPLAT", name: "Seplat Energy Plc", sector: "Oil & Gas", basePrice: 5800 },
  { symbol: "OANDO", name: "Oando Plc", sector: "Oil & Gas", basePrice: 55 },
  { symbol: "CONOIL", name: "Conoil Plc", sector: "Oil & Gas", basePrice: 105 },
  { symbol: "BUAFOODS", name: "BUA Foods Plc", sector: "Consumer Goods", basePrice: 340 },
  { symbol: "NESTLE", name: "Nestle Nigeria Plc", sector: "Consumer Goods", basePrice: 1450 },
  { symbol: "NB", name: "Nigerian Breweries Plc", sector: "Consumer Goods", basePrice: 42 },
  { symbol: "FLOURMILL", name: "Flour Mills of Nigeria Plc", sector: "Consumer Goods", basePrice: 62 },
  { symbol: "DANGSUGAR", name: "Dangote Sugar Refinery Plc", sector: "Consumer Goods", basePrice: 46 },
  { symbol: "OKOMUOIL", name: "The Okomu Oil Palm Company Plc", sector: "Agriculture", basePrice: 480 },
  { symbol: "PRESCO", name: "Presco Plc", sector: "Agriculture", basePrice: 850 },
  { symbol: "TRANSCORP", name: "Transnational Corporation Plc", sector: "Conglomerates", basePrice: 38 },
  { symbol: "GEREGU", name: "Geregu Power Plc", sector: "Utilities", basePrice: 610 },
  { symbol: "UNILEVER", name: "Unilever Nigeria Plc", sector: "Consumer Goods", basePrice: 34 },
];
