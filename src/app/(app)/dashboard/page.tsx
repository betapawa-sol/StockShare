import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getAllStocksWithSignals } from "@/lib/market/queries";
import { SignalBadge, ChangeText } from "@/components/SignalBadge";

export default async function DashboardPage() {
  const user = await requireUser();
  const stocks = await getAllStocksWithSignals();

  const ranked = [...stocks].sort((a, b) => (b.latest?.changePercent ?? 0) - (a.latest?.changePercent ?? 0));
  const gainers = ranked.slice(0, 5);
  const losers = ranked.slice(-5).reverse();

  const bySector = new Map<string, { count: number; totalChange: number }>();
  for (const stock of stocks) {
    const entry = bySector.get(stock.sector) ?? { count: 0, totalChange: 0 };
    entry.count += 1;
    entry.totalChange += stock.latest?.changePercent ?? 0;
    bySector.set(stock.sector, entry);
  }
  const sectors = [...bySector.entries()]
    .map(([sector, { count, totalChange }]) => ({ sector, count, avgChange: totalChange / count }))
    .sort((a, b) => b.avgChange - a.avgChange);

  const asOf = stocks.find((s) => s.latest)?.latest?.date;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-neutral-400">
          NGX daily trend snapshot{asOf ? ` — as of ${new Date(asOf).toDateString()}` : ""}.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <MoversCard title="Top gainers" stocks={gainers} />
        <MoversCard title="Top losers" stocks={losers} />
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Sector performance</h2>
          <ul className="flex flex-col gap-2">
            {sectors.map((s) => (
              <li key={s.sector} className="flex items-center justify-between text-sm">
                <span className="text-neutral-300">
                  {s.sector} <span className="text-neutral-500">({s.count})</span>
                </span>
                <ChangeText value={s.avgChange} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50">
        <div className="border-b border-neutral-800 p-4">
          <h2 className="font-semibold">All NGX tickers we track</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-neutral-400">
                <th className="px-4 py-2">Symbol</th>
                <th className="px-4 py-2">Sector</th>
                <th className="px-4 py-2 text-right">Price (₦)</th>
                <th className="px-4 py-2 text-right">Change</th>
                <th className="px-4 py-2">Signal</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => (
                <tr key={stock.id} className="border-b border-neutral-900 hover:bg-neutral-900/60">
                  <td className="px-4 py-2">
                    <Link href={`/stocks/${stock.symbol}`} className="font-medium text-neutral-100 hover:text-emerald-400">
                      {stock.symbol}
                    </Link>
                    <div className="text-xs text-neutral-500">{stock.name}</div>
                  </td>
                  <td className="px-4 py-2 text-neutral-400">{stock.sector}</td>
                  <td className="px-4 py-2 text-right">{stock.latest?.close.toFixed(2) ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    {stock.latest ? <ChangeText value={stock.latest.changePercent} /> : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <SignalBadge signal={stock.prediction.signal} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MoversCard({
  title,
  stocks,
}: {
  title: string;
  stocks: Awaited<ReturnType<typeof getAllStocksWithSignals>>;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <h2 className="mb-3 text-sm font-semibold text-neutral-300">{title}</h2>
      <ul className="flex flex-col gap-2">
        {stocks.map((stock) => (
          <li key={stock.id} className="flex items-center justify-between text-sm">
            <Link href={`/stocks/${stock.symbol}`} className="text-neutral-200 hover:text-emerald-400">
              {stock.symbol}
            </Link>
            <ChangeText value={stock.latest?.changePercent ?? 0} />
          </li>
        ))}
      </ul>
    </div>
  );
}
