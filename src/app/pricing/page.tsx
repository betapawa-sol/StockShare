import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { PLAN_FEATURES } from "@/lib/plans";
import { SiteHeader } from "@/components/SiteHeader";

export default async function PricingPage() {
  const user = await getCurrentUser();
  const ctaHref = user ? "/account" : "/register";

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold">Simple, freemium pricing</h1>
          <p className="mt-2 text-neutral-400">Start free. Upgrade when you want the full picture.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {(["FREE", "PREMIUM"] as const).map((tier) => (
            <div key={tier} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8">
              <h2 className="text-xl font-semibold">{tier === "FREE" ? "Free" : "Premium"}</h2>
              <p className="mt-1 text-3xl font-bold">
                {tier === "FREE" ? "₦0" : "₦4,999"}
                <span className="text-sm font-normal text-neutral-500">/mo</span>
              </p>
              <ul className="mt-6 flex flex-col gap-2 text-sm text-neutral-400">
                {PLAN_FEATURES[tier].map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <Link
                href={ctaHref}
                className="mt-6 block rounded-lg bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
              >
                {tier === "FREE" ? "Get started" : "Go Premium"}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
