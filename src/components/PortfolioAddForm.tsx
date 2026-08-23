"use client";

import { useActionState } from "react";
import { addHoldingAction, type ActionState } from "@/app/actions/portfolio";

export function PortfolioAddForm({
  stocks,
  disabled,
}: {
  stocks: { symbol: string; name: string }[];
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addHoldingAction, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs text-neutral-400">Stock</label>
        <select
          name="symbol"
          required
          disabled={disabled}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm disabled:opacity-50"
        >
          {stocks.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.symbol} — {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Quantity</label>
        <input
          name="quantity"
          type="number"
          step="any"
          min="0"
          required
          disabled={disabled}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm disabled:opacity-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Avg. cost (₦)</label>
        <input
          name="averageCost"
          type="number"
          step="any"
          min="0"
          required
          disabled={disabled}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm disabled:opacity-50"
        />
      </div>
      {state?.error && <p className="sm:col-span-4 text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || disabled}
        className="sm:col-span-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add holding"}
      </button>
    </form>
  );
}
