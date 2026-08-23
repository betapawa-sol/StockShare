import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getStockWithSignal, getPriceHistoryForChart } from "@/lib/market/queries";
import { getEntitlements, asTier } from "@/lib/entitlements";
import { prisma } from "@/lib/db";
import { SignalBadge, ChangeText } from "@/components/SignalBadge";
import { PriceChart } from "@/components/PriceChart";
import { AddHoldingForm } from "@/components/AddHoldingForm";
import { toggleWatchlistAction } from "@/app/actions/portfolio";
import Link from "next/link";

export default async function StockDetailPage({ params }: PageProps<"/stocks/[symbol]">) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  const user = await requireUser();
  const stock = await getStockWithSignal(symbol);
  if (!stock) notFound();

  const entitlements = getEntitlements(asTier(user.tier));
  const [history, watchlisted, holding] = await Promise.all([
    getPriceHistoryForChart(symbol, entitlements.priceHistoryDays),
    prisma.watchlistItem.findFirst({ where: { userId: user.id, stock: { symbol } } }),
    prisma.holding.findFirst({ where: { userId: user.id, stock: { symbol } } }),
  ]);

  const { prediction, latest } = stock;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-400">
            <Link href="/dashboard" className="hover:text-emerald-400">
              ← Back to dashboard
            </Link>
          </p>
          <h1 className="text-2xl font-bold">
            {stock.symbol} <span className="font-normal text-neutral-400">· {stock.name}</span>
          </h1>
          <p className="text-sm text-neutral-500">{stock.sector}</p>
        </div>
        <form action={toggleWatchlistAction}>
          <input type="hidden" name="symbol" value={symbol} />
          <button
            type="submit"
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-emerald-500 hover:text-emerald-400"
          >
            {watchlisted ? "★ On watchlist" : "☆ Add to watchlist"}
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold">₦{latest?.close.toFixed(2) ?? "—"}</span>{" "}
              {latest && <ChangeText value={latest.changePercent} className="ml-2 text-base" />}
            </div>
          </div>
          <PriceChart data={history} />
          {entitlements.priceHistoryDays < 180 && (
            <p className="mt-2 text-xs text-neutral-500">
              Free plan shows the last {entitlements.priceHistoryDays} trading days.{" "}
              <Link href="/account" className="text-emerald-400 hover:underline">
                Upgrade for full history
              </Link>
              .
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-300">Trend signal</h2>
              <SignalBadge signal={prediction.signal} />
            </div>
            {entitlements.fullSignalDetail ? (
              <>
                <p className="text-xs text-neutral-500">Confidence score: {prediction.score.toFixed(2)}</p>
                <p className="mt-2 text-sm text-neutral-400">{prediction.rationale}</p>
              </>
            ) : (
              <div className="mt-2 rounded-lg border border-dashed border-neutral-700 p-3 text-sm text-neutral-500">
                Upgrade to Premium to see the confidence score and full rationale behind this signal.{" "}
                <Link href="/account" className="text-emerald-400 hover:underline">
                  View plans
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-300">
              {holding ? "Update your position" : "Add to portfolio"}
            </h2>
            <AddHoldingForm symbol={symbol} />
            {holding && (
              <p className="mt-2 text-xs text-neutral-500">
                Current position: {holding.quantity.toLocaleString()} shares @ ₦{holding.averageCost.toFixed(2)} avg.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
