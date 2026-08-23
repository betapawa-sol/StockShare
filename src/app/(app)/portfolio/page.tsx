import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPortfolioSummary, getPortfolioHistory, recordPortfolioSnapshot } from "@/lib/portfolio";
import { getEntitlements, asTier } from "@/lib/entitlements";
import { SignalBadge, ChangeText } from "@/components/SignalBadge";
import { PortfolioAddForm } from "@/components/PortfolioAddForm";
import { PriceChart } from "@/components/PriceChart";
import { removeHoldingAction } from "@/app/actions/portfolio";

export default async function PortfolioPage() {
  const user = await requireUser();
  const entitlements = getEntitlements(asTier(user.tier));

  const summary = await getPortfolioSummary(user.id);
  if (summary.holdings.length > 0) {
    await recordPortfolioSnapshot(user.id);
  }
  const history = await getPortfolioHistory(user.id);
  const allStocks = await prisma.stock.findMany({ orderBy: { symbol: "asc" }, select: { symbol: true, name: true } });

  const atLimit = summary.holdings.length >= entitlements.maxHoldings;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Your portfolio</h1>
        <p className="text-sm text-neutral-400">
          {summary.holdings.length} / {Number.isFinite(entitlements.maxHoldings) ? entitlements.maxHoldings : "∞"}{" "}
          holdings tracked
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Market value" value={`₦${summary.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <SummaryCard label="Cost basis" value={`₦${summary.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <SummaryCard
          label="Gain / loss"
          value={`₦${summary.totalGainLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={<ChangeText value={summary.totalGainLossPct} />}
        />
      </div>

      {history.length > 1 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Portfolio value over time</h2>
          <PriceChart data={history} label="Value" />
        </div>
      )}

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50">
        <div className="border-b border-neutral-800 p-4">
          <h2 className="font-semibold">Holdings</h2>
        </div>
        {summary.holdings.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">No holdings yet — add your first one below.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-neutral-400">
                  <th className="px-4 py-2">Stock</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Avg. cost</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Value</th>
                  <th className="px-4 py-2 text-right">Gain/Loss</th>
                  <th className="px-4 py-2">Signal</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {summary.holdings.map((h) => (
                  <tr key={h.id} className="border-b border-neutral-900">
                    <td className="px-4 py-2">
                      <Link href={`/stocks/${h.symbol}`} className="font-medium hover:text-emerald-400">
                        {h.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right">{h.quantity.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">₦{h.averageCost.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">₦{h.currentPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">₦{h.marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-2 text-right">
                      <ChangeText value={h.gainLossPct} />
                    </td>
                    <td className="px-4 py-2">
                      <SignalBadge signal={h.signal} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <form action={removeHoldingAction}>
                        <input type="hidden" name="holdingId" value={h.id} />
                        <button type="submit" className="text-xs text-neutral-500 hover:text-red-400">
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        <h2 className="mb-3 font-semibold">{atLimit ? "Holding limit reached" : "Add a holding"}</h2>
        {atLimit ? (
          <p className="text-sm text-neutral-400">
            The Free plan tracks up to {entitlements.maxHoldings} holdings.{" "}
            <Link href="/account" className="text-emerald-400 hover:underline">
              Upgrade to Premium
            </Link>{" "}
            for unlimited holdings.
          </p>
        ) : (
          <PortfolioAddForm stocks={allStocks} />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {sub && <div className="mt-1 text-sm">{sub}</div>}
    </div>
  );
}
