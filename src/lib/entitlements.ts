// Freemium tiers. Kept intentionally simple (two hard-coded plans, no billing
// integration yet) — swap in real subscription state here once payments land,
// every call site already goes through this module rather than checking
// `user.tier` directly.

export type Tier = "FREE" | "PREMIUM";

export type EntitlementSet = {
  maxHoldings: number;
  maxRecommendations: number;
  maxWatchlist: number;
  priceHistoryDays: number;
  fullSignalDetail: boolean; // score + rationale, vs just BUY/HOLD/SELL
};

const ENTITLEMENTS: Record<Tier, EntitlementSet> = {
  FREE: {
    maxHoldings: 5,
    maxRecommendations: 3,
    maxWatchlist: 5,
    priceHistoryDays: 30,
    fullSignalDetail: false,
  },
  PREMIUM: {
    maxHoldings: Infinity,
    maxRecommendations: Infinity,
    maxWatchlist: Infinity,
    priceHistoryDays: 180,
    fullSignalDetail: true,
  },
};

export function getEntitlements(tier: Tier): EntitlementSet {
  return ENTITLEMENTS[tier];
}

export function isPremium(tier: Tier): boolean {
  return tier === "PREMIUM";
}

/** The `User.tier` column is a plain string (SQLite has no enum type) — validate it here. */
export function asTier(value: string): Tier {
  return value === "PREMIUM" ? "PREMIUM" : "FREE";
}
