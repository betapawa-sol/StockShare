"use client";

import { useActionState } from "react";
import { addHoldingAction, type ActionState } from "@/app/actions/portfolio";

export function AddHoldingForm({ symbol, disabled }: { symbol: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addHoldingAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="symbol" value={symbol} />
      <div className="flex gap-3">
        <div className="flex-1">
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
        <div className="flex-1">
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
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || disabled}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {pending ? "Saving…" : `Add ${symbol} to portfolio`}
      </button>
    </form>
  );
}
