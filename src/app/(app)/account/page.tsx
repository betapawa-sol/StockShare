import { requireUser } from "@/lib/auth";
import { setTierAction } from "@/app/actions/account";
import { PLAN_FEATURES } from "@/lib/plans";

export default async function AccountPage() {
  const user = await requireUser();
  const isPremium = user.tier === "PREMIUM";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-sm text-neutral-400">{user.name} · {user.email}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {(["FREE", "PREMIUM"] as const).map((tier) => {
          const active = user.tier === tier;
          return (
            <div
              key={tier}
              className={`rounded-xl border p-6 ${
                active ? "border-emerald-500 bg-emerald-500/5" : "border-neutral-800 bg-neutral-900/50"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{tier === "FREE" ? "Free" : "Premium"}</h2>
                {active && <span className="text-xs font-semibold text-emerald-400">CURRENT PLAN</span>}
              </div>
              <ul className="mb-4 flex flex-col gap-1 text-sm text-neutral-400">
                {PLAN_FEATURES[tier].map((feature) => (
                  <li key={feature}>· {feature}</li>
                ))}
              </ul>
              {!active && (
                <form action={setTierAction}>
                  <input type="hidden" name="tier" value={tier} />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
                  >
                    {tier === "PREMIUM" ? "Upgrade to Premium" : "Downgrade to Free"}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-neutral-600">
        {isPremium
          ? "This is a demo toggle standing in for real billing — wire up Stripe/Paystack/Flutterwave here before launch."
          : "Plan changes here are instant for demo purposes; a production build would route this through a payment provider."}
      </p>
    </div>
  );
}
