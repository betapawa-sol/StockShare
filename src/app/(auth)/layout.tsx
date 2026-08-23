import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-xl">
        <Link href="/" className="mb-6 block text-center text-xl font-bold text-emerald-400">
          StockShare
        </Link>
        {children}
      </div>
    </div>
  );
}
