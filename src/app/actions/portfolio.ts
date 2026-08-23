"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getEntitlements, asTier } from "@/lib/entitlements";

export type ActionState = { error?: string } | undefined;

const HoldingSchema = z.object({
  symbol: z.string().trim().toUpperCase().min(1),
  quantity: z.coerce.number().positive("Quantity must be greater than zero."),
  averageCost: z.coerce.number().positive("Average cost must be greater than zero."),
});

export async function addHoldingAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const validated = HoldingSchema.safeParse({
    symbol: formData.get("symbol"),
    quantity: formData.get("quantity"),
    averageCost: formData.get("averageCost"),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Invalid input." };
  }

  const entitlements = getEntitlements(asTier(user.tier));
  const currentCount = await prisma.holding.count({ where: { userId: user.id } });

  const stock = await prisma.stock.findUnique({ where: { symbol: validated.data.symbol } });
  if (!stock) return { error: `Unknown ticker "${validated.data.symbol}".` };

  const existing = await prisma.holding.findUnique({
    where: { userId_stockId: { userId: user.id, stockId: stock.id } },
  });

  if (!existing && currentCount >= entitlements.maxHoldings) {
    return {
      error: `Free plan is limited to ${entitlements.maxHoldings} holdings. Upgrade to Premium to track more.`,
    };
  }

  await prisma.holding.upsert({
    where: { userId_stockId: { userId: user.id, stockId: stock.id } },
    update: { quantity: validated.data.quantity, averageCost: validated.data.averageCost },
    create: {
      userId: user.id,
      stockId: stock.id,
      quantity: validated.data.quantity,
      averageCost: validated.data.averageCost,
    },
  });

  revalidatePath("/portfolio");
  revalidatePath("/recommendations");
  return undefined;
}

export async function removeHoldingAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const holdingId = String(formData.get("holdingId") ?? "");
  await prisma.holding.deleteMany({ where: { id: holdingId, userId: user.id } });
  revalidatePath("/portfolio");
  revalidatePath("/recommendations");
}

export async function toggleWatchlistAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const symbol = String(formData.get("symbol") ?? "").toUpperCase();
  const stock = await prisma.stock.findUnique({ where: { symbol } });
  if (!stock) return;

  const existing = await prisma.watchlistItem.findUnique({
    where: { userId_stockId: { userId: user.id, stockId: stock.id } },
  });

  if (existing) {
    await prisma.watchlistItem.delete({ where: { id: existing.id } });
  } else {
    const entitlements = getEntitlements(asTier(user.tier));
    const count = await prisma.watchlistItem.count({ where: { userId: user.id } });
    if (count >= entitlements.maxWatchlist) return;
    await prisma.watchlistItem.create({ data: { userId: user.id, stockId: stock.id } });
  }

  revalidatePath(`/stocks/${symbol}`);
}
