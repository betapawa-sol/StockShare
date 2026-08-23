import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SignalBadge, ChangeText } from "@/components/SignalBadge";
import { getAllStocksWithSignals } from "@/lib/market/queries";

const FEATURES = [
  {
    title: "Daily market trend",
    body: "Top gainers, top losers, and sector performance across the Nigerian Exchange, refreshed every trading day.",
  },
  {
    title: "Predictive signals",
    body: "A transparent BUY / HOLD / SELL trend model for every tracked stock, with the reasoning behind each call.",
  },
  {
    title: "Portfolio tracking",
    body: "Add the shares and firms you actually hold and see live gain/loss, value over time, and concentration risk.",
  },
  {
    title: "Personalized recommendations",
    body: "Suggestions built from your holdings plus market-wide signals — not generic advice.",
  },
];

export default async function LandingPage() {
  const stocks = await getAllStocksWithSignals();
  const preview = [...stocks].sort((a, b) => (b.latest?.changePercent ?? 0) - (a.latest?.changePercent ?? 0)).slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Make smarter moves in the <span className="text-emerald-400">Nigerian stock market</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">
            StockShare tracks daily NGX trends, scores stocks with a transparent predictive model, and turns your
            actual portfolio into personalized recommendations — free to start.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-neutral-950 hover:bg-emerald-400"
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold text-neutral-200 hover:border-emerald-500"
            >
              See pricing
            </Link>
          </div>
        </section>

        {preview.length > 0 && (
          <section className="mx-auto max-w-4xl px-4 pb-16">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
              <h2 className="mb-4 text-sm font-semibold text-neutral-400">Today&apos;s top movers</h2>
              <div className="grid gap-3 sm:grid-cols-5">
                {preview.map((stock) => (
                  <div key={stock.id} className="rounded-lg border border-neutral-800 p-3 text-center">
                    <p className="font-semibold">{stock.symbol}</p>
                    <p className="text-xs text-neutral-500">₦{stock.latest?.close.toFixed(2) ?? "—"}</p>
                    <ChangeText value={stock.latest?.changePercent ?? 0} className="block text-sm" />
                    <SignalBadge signal={stock.prediction.signal} className="mt-2" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-5xl px-4 pb-24">
          <div className="grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
                <h3 className="font-semibold text-emerald-400">{feature.title}</h3>
                <p className="mt-2 text-sm text-neutral-400">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800 px-4 py-6 text-center text-xs text-neutral-600">
        StockShare — trading insight for the Nigerian stock market. Not investment advice.
      </footer>
    </div>
  );
}
