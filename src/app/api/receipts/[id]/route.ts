import { NextRequest, NextResponse } from "next/server";
import { deleteReceipt, getReceipt, updateReceipt } from "@/lib/db";
import { isValidCurrency } from "@/lib/currencies";
import type { Currency } from "@/lib/types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const receipt = getReceipt(id);

  if (!receipt) {
    return NextResponse.json({ error: "找不到此記錄" }, { status: 404 });
  }

  return NextResponse.json(receipt);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const currency = body.currency as string | undefined;

    const receipt = updateReceipt(id, {
      title: body.title,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      currency: currency && isValidCurrency(currency) ? (currency as Currency) : undefined,
      category: body.category,
      merchant: body.merchant,
      date: body.date,
      notes: body.notes,
    });

    if (!receipt) {
      return NextResponse.json({ error: "找不到此記錄" }, { status: 404 });
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Failed to update receipt:", error);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const deleted = deleteReceipt(id);

  if (!deleted) {
    return NextResponse.json({ error: "找不到此記錄" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
