import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/recommendations", label: "Recommendations" },
];

export async function AppNavbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-emerald-400">
            StockShare
          </Link>
          <nav className="hidden gap-4 text-sm text-neutral-300 sm:flex">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-emerald-400">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {user && (
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/account"
              className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-300 hover:border-emerald-500 hover:text-emerald-400"
            >
              {user.name} ·{" "}
              <span className={user.tier === "PREMIUM" ? "text-amber-400" : "text-neutral-400"}>
                {user.tier}
              </span>
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="text-neutral-400 hover:text-red-400">
                Log out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
