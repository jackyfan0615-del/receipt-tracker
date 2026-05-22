import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { analyzeReceiptImage } from "@/lib/ai-receipt";
import { createReceipt, getUploadsDir } from "@/lib/db";
import { isValidCurrency, DEFAULT_CURRENCY } from "@/lib/currencies";
import type { Currency } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "請上傳收據圖片" }, { status: 400 });
    }

    const mimeType = file.type || "image/jpeg";
    if (!ALLOWED_TYPES.includes(mimeType) && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
      return NextResponse.json(
        { error: "不支援的圖片格式，請使用 JPG、PNG 或 WebP" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${uuidv4()}${ext}`;
    const uploadsDir = getUploadsDir();
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);

    const manualOverride = formData.get("manual") === "true";
    let analysis;

    if (manualOverride) {
      const currency = formData.get("currency") as string;
      analysis = {
        title: (formData.get("title") as string) || "未命名收據",
        amount: parseFloat(formData.get("amount") as string) || 0,
        currency: (isValidCurrency(currency) ? currency : DEFAULT_CURRENCY) as Currency,
        category: (formData.get("category") as string) || "其他",
        merchant: (formData.get("merchant") as string) || null,
        date: (formData.get("date") as string) || new Date().toISOString().slice(0, 10),
        notes: (formData.get("notes") as string) || null,
      };
    } else {
      analysis = await analyzeReceiptImage(buffer, mimeType);
    }

    const receipt = createReceipt(
      {
        title: analysis.title,
        amount: analysis.amount,
        currency: analysis.currency,
        category: analysis.category,
        merchant: analysis.merchant,
        date: analysis.date,
        notes: analysis.notes,
      },
      filename
    );

    return NextResponse.json({ receipt, analysis });
  } catch (error) {
    console.error("Failed to upload receipt:", error);
    return NextResponse.json({ error: "上傳失敗，請稍後再試" }, { status: 500 });
  }
}
