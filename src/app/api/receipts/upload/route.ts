import { NextRequest, NextResponse } from "next/server";
import { processReceiptUpload } from "@/lib/process-receipt-upload";
import { isValidCurrency, DEFAULT_CURRENCY } from "@/lib/currencies";
import type { Currency } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "請上傳收據圖片" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const manualOverride = formData.get("manual") === "true";

    const result = await processReceiptUpload(buffer, file.name, mimeType, {
      manual: manualOverride,
      title: (formData.get("title") as string) || undefined,
      amount: manualOverride
        ? parseFloat(formData.get("amount") as string) || 0
        : undefined,
      currency: manualOverride
        ? ((isValidCurrency(formData.get("currency") as string)
            ? formData.get("currency")
            : DEFAULT_CURRENCY) as Currency)
        : undefined,
      category: (formData.get("category") as string) || undefined,
      merchant: (formData.get("merchant") as string) || undefined,
      date: (formData.get("date") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    return NextResponse.json({
      receipt: result.receipt,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error("Failed to upload receipt:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "上傳失敗，請稍後再試",
      },
      { status: 500 }
    );
  }
}
