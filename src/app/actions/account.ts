"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// Placeholder for real billing (Stripe/Paystack/Flutterwave). Flips the tier
// directly so the freemium gating can be demoed end-to-end before payments exist.
export async function setTierAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const tier = String(formData.get("tier") ?? "FREE") === "PREMIUM" ? "PREMIUM" : "FREE";
  await prisma.user.update({ where: { id: user.id }, data: { tier } });
  revalidatePath("/account");
  revalidatePath("/portfolio");
  revalidatePath("/recommendations");
}
