import clsx from "clsx";
import type { Signal } from "@/lib/prediction";

const STYLES: Record<Signal, string> = {
  BUY: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  SELL: "bg-red-500/15 text-red-400 border-red-500/30",
  HOLD: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
};

export function SignalBadge({ signal, className }: { signal: Signal; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STYLES[signal],
        className,
      )}
    >
      {signal}
    </span>
  );
}

export function ChangeText({ value, className }: { value: number; className?: string }) {
  const positive = value > 0;
  const negative = value < 0;
  return (
    <span
      className={clsx(
        "font-medium",
        positive && "text-emerald-400",
        negative && "text-red-400",
        !positive && !negative && "text-neutral-400",
        className,
      )}
    >
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}
