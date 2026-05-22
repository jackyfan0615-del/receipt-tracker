import { NextRequest, NextResponse } from "next/server";
import { verifyAgentApiKey, getAgentAuthError } from "@/lib/agent-auth";
import {
  formatReceiptSummary,
  processReceiptUpload,
} from "@/lib/process-receipt-upload";
import { isValidCurrency } from "@/lib/currencies";
import type { Currency } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyAgentApiKey(request)) {
    return NextResponse.json(getAgentAuthError(), { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const imageBase64 = body.imageBase64 as string | undefined;

      if (!imageBase64) {
        return NextResponse.json({ error: "缺少 imageBase64" }, { status: 400 });
      }

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const mimeType = (body.mimeType as string) || "image/jpeg";
      const filename = (body.filename as string) || "receipt.jpg";

      const result = await processReceiptUpload(buffer, filename, mimeType, {
        manual: body.manual === true,
        title: body.title,
        amount: body.amount !== undefined ? Number(body.amount) : undefined,
        currency:
          body.currency && isValidCurrency(body.currency)
            ? (body.currency as Currency)
            : undefined,
        category: body.category,
        merchant: body.merchant,
        date: body.date,
        notes: body.notes,
        source: "Cursor Agent",
      });

      return NextResponse.json({
        success: true,
        summary: formatReceiptSummary(result.receipt),
        receipt: result.receipt,
        analysis: result.analysis,
      });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "請提供 file 欄位" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const notes = (formData.get("notes") as string) || null;

    const result = await processReceiptUpload(buffer, file.name, mimeType, {
      manual: formData.get("manual") === "true",
      title: (formData.get("title") as string) || undefined,
      amount:
        formData.get("amount") !== null
          ? parseFloat(formData.get("amount") as string)
          : undefined,
      currency:
        formData.get("currency") && isValidCurrency(formData.get("currency") as string)
          ? (formData.get("currency") as Currency)
          : undefined,
      category: (formData.get("category") as string) || undefined,
      merchant: (formData.get("merchant") as string) || undefined,
      date: (formData.get("date") as string) || undefined,
      notes,
      source: "Cursor Agent",
    });

    return NextResponse.json({
      success: true,
      summary: formatReceiptSummary(result.receipt),
      receipt: result.receipt,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error("Agent upload failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Agent 上傳失敗，請稍後再試",
      },
      { status: 500 }
    );
  }
}
