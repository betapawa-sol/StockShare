import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-neutral-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-emerald-400">
          StockShare
        </Link>
        <nav className="flex items-center gap-6 text-sm text-neutral-300">
          <Link href="/pricing" className="hover:text-emerald-400">
            Pricing
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-emerald-500 px-4 py-1.5 font-semibold text-neutral-950 hover:bg-emerald-400"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-emerald-400">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-500 px-4 py-1.5 font-semibold text-neutral-950 hover:bg-emerald-400"
              >
                Sign up free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
