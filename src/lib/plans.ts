import { getEntitlements } from "@/lib/entitlements";

const free = getEntitlements("FREE");
const premium = getEntitlements("PREMIUM");

export const PLAN_FEATURES: Record<"FREE" | "PREMIUM", string[]> = {
  FREE: [
    `Track up to ${free.maxHoldings} holdings`,
    `Up to ${free.maxWatchlist} watchlist stocks`,
    `${free.priceHistoryDays}-day price history & charts`,
    `Top ${free.maxRecommendations} personalized recommendations`,
    "BUY / HOLD / SELL signal on every tracked stock",
  ],
  PREMIUM: [
    "Unlimited holdings & watchlist",
    `${premium.priceHistoryDays}-day price history & charts`,
    "Unlimited personalized recommendations",
    "Full signal detail: confidence score & rationale",
    "Priority support",
  ],
};
