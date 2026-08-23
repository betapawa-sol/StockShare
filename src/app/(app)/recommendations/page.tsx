import Link from "next/link";
import clsx from "clsx";
import { requireUser } from "@/lib/auth";
import { generateRecommendations, type RecommendationKind } from "@/lib/recommendations";
import { getEntitlements, asTier } from "@/lib/entitlements";

const KIND_LABEL: Record<RecommendationKind, string> = {
  BUY_SIGNAL: "Buy signal",
  SELL_SIGNAL: "Sell signal",
  DIVERSIFY: "Diversify",
  CONCENTRATION_RISK: "Concentration risk",
};

const KIND_STYLE: Record<RecommendationKind, string> = {
  BUY_SIGNAL: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  SELL_SIGNAL: "border-red-500/30 bg-red-500/10 text-red-400",
  DIVERSIFY: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  CONCENTRATION_RISK: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

export default async function RecommendationsPage() {
  const user = await requireUser();
  const entitlements = getEntitlements(asTier(user.tier));

  const all = await generateRecommendations(user.id);
  const visible = all.slice(0, entitlements.maxRecommendations);
  const locked = all.length - visible.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Recommendations</h1>
        <p className="text-sm text-neutral-400">
          Generated from your holdings and today&apos;s trend signals across the market.
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No recommendations yet — <Link href="/portfolio" className="text-emerald-400 hover:underline">add a holding</Link> to get personalized signals.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((rec, i) => (
            <li
              key={`${rec.stockSymbol}-${rec.kind}-${i}`}
              className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
            >
              <div className="mb-1 flex items-center justify-between">
                <Link href={rec.stockSymbol !== "—" ? `/stocks/${rec.stockSymbol}` : "#"} className="font-semibold hover:text-emerald-400">
                  {rec.stockSymbol !== "—" ? `${rec.stockSymbol} · ${rec.stockName}` : rec.stockName}
                </Link>
                <span className={clsx("rounded-full border px-2.5 py-0.5 text-xs font-semibold", KIND_STYLE[rec.kind])}>
                  {KIND_LABEL[rec.kind]}
                </span>
              </div>
              <p className="text-sm text-neutral-400">{rec.reason}</p>
            </li>
          ))}
        </ul>
      )}

      {locked > 0 && (
        <div className="rounded-xl border border-dashed border-neutral-700 p-4 text-sm text-neutral-400">
          {locked} more recommendation{locked === 1 ? "" : "s"} available on Premium.{" "}
          <Link href="/account" className="text-emerald-400 hover:underline">
            Upgrade to see all
          </Link>
          .
        </div>
      )}
    </div>
  );
}
