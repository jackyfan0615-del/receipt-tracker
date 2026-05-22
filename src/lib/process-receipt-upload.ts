import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { analyzeReceiptImage } from "./ai-receipt";
import { createReceipt, getUploadsDir } from "./db";
import { isValidCurrency, DEFAULT_CURRENCY } from "./currencies";
import type { Currency, Receipt, ReceiptAnalysis } from "./types";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export interface ProcessReceiptOptions {
  manual?: boolean;
  title?: string;
  amount?: number;
  currency?: Currency;
  category?: string | null;
  merchant?: string | null;
  date?: string;
  notes?: string | null;
  source?: string;
}

export interface ProcessReceiptResult {
  receipt: Receipt;
  analysis: ReceiptAnalysis;
}

export function isAllowedImageType(mimeType: string, filename: string): boolean {
  return (
    ALLOWED_TYPES.includes(mimeType) ||
    !!filename.match(/\.(jpe?g|png|webp|heic|heif)$/i)
  );
}

export async function processReceiptUpload(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
  options: ProcessReceiptOptions = {}
): Promise<ProcessReceiptResult> {
  if (!isAllowedImageType(mimeType, originalFilename)) {
    throw new Error("不支援的圖片格式，請使用 JPG、PNG 或 WebP");
  }

  const ext = path.extname(originalFilename) || ".jpg";
  const filename = `${uuidv4()}${ext}`;
  const uploadsDir = getUploadsDir();
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);

  let analysis: ReceiptAnalysis;

  if (options.manual) {
    analysis = {
      title: options.title || "未命名收據",
      amount: options.amount ?? 0,
      currency:
        options.currency && isValidCurrency(options.currency)
          ? options.currency
          : DEFAULT_CURRENCY,
      category: options.category || "其他",
      merchant: options.merchant ?? null,
      date: options.date || new Date().toISOString().slice(0, 10),
      notes: options.notes ?? null,
    };
  } else {
    analysis = await analyzeReceiptImage(buffer, mimeType);
    if (options.notes) {
      analysis.notes = analysis.notes
        ? `${analysis.notes} | ${options.notes}`
        : options.notes;
    }
  }

  const receiptNotes = options.source
    ? [analysis.notes, `來源：${options.source}`].filter(Boolean).join(" | ")
    : analysis.notes;

  const receipt = createReceipt(
    {
      title: analysis.title,
      amount: analysis.amount,
      currency: analysis.currency,
      category: analysis.category,
      merchant: analysis.merchant,
      date: analysis.date,
      notes: receiptNotes,
    },
    filename
  );

  return { receipt, analysis };
}

export function formatReceiptSummary(receipt: Receipt): string {
  return [
    `✅ 已記帳：${receipt.title}`,
    `💰 金額：${receipt.currency} ${receipt.amount}`,
    receipt.merchant ? `🏪 商家：${receipt.merchant}` : null,
    receipt.category ? `📂 分類：${receipt.category}` : null,
    `📅 日期：${receipt.date}`,
    `🆔 記錄 ID：${receipt.id}`,
  ]
    .filter(Boolean)
    .join("\n");
}
