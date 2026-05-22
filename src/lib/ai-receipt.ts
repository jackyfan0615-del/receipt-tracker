import OpenAI from "openai";
import type { ReceiptAnalysis } from "./types";
import { DEFAULT_CURRENCY, isValidCurrency } from "./currencies";

const SYSTEM_PROMPT = `你是一個收據辨識助手。分析收據圖片並提取以下資訊，以 JSON 格式回傳：
{
  "title": "簡短描述（例如：超市購物、餐廳用餐）",
  "amount": 數字（不含貨幣符號）,
  "currency": "HKD" | "TWD" | "USD" | "JPY",
  "category": "分類（例如：餐飲、交通、購物、住宿、其他）",
  "merchant": "商家名稱",
  "date": "YYYY-MM-DD 格式的日期",
  "notes": "其他備註或 null"
}

規則：
- 若無法確定貨幣，預設 HKD
- 若無法確定日期，使用今天日期
- amount 必須是數字
- 只回傳 JSON，不要其他文字`;

export async function analyzeReceiptImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ReceiptAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return getFallbackAnalysis();
  }

  const openai = new OpenAI({ apiKey });
  const base64 = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "請分析這張收據並提取資訊。",
          },
          {
            type: "image_url",
            image_url: { url: dataUrl, detail: "high" },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return getFallbackAnalysis();
  }

  try {
    const parsed = JSON.parse(content) as Partial<ReceiptAnalysis>;
    return normalizeAnalysis(parsed);
  } catch {
    return getFallbackAnalysis();
  }
}

function normalizeAnalysis(parsed: Partial<ReceiptAnalysis>): ReceiptAnalysis {
  const today = new Date().toISOString().slice(0, 10);

  return {
    title: parsed.title?.trim() || "未命名收據",
    amount: typeof parsed.amount === "number" ? parsed.amount : 0,
    currency:
      parsed.currency && isValidCurrency(parsed.currency)
        ? parsed.currency
        : DEFAULT_CURRENCY,
    category: parsed.category?.trim() || "其他",
    merchant: parsed.merchant?.trim() || null,
    date: parsed.date?.match(/^\d{4}-\d{2}-\d{2}$/) ? parsed.date : today,
    notes: parsed.notes?.trim() || null,
  };
}

function getFallbackAnalysis(): ReceiptAnalysis {
  const today = new Date().toISOString().slice(0, 10);
  return {
    title: "未命名收據",
    amount: 0,
    currency: DEFAULT_CURRENCY,
    category: "其他",
    merchant: null,
    date: today,
    notes: "請設定 OPENAI_API_KEY 以啟用 AI 自動辨識，或手動填寫資訊",
  };
}
