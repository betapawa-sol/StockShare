export type DailyBar = {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type StockInfo = {
  symbol: string;
  name: string;
  sector: string;
};

export interface DataProvider {
  readonly id: string;
  /** All stocks this provider knows about, for keeping the Stock table up to date. */
  listStocks(): Promise<StockInfo[]>;
  /** One OHLCV bar per known symbol for the given trading day. */
  fetchDailyBars(date: Date): Promise<DailyBar[]>;
}
