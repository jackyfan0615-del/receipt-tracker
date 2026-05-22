import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { format } from "date-fns";
import type { Receipt } from "./types";
import { formatAmount } from "./currencies";
import { getUploadsDir } from "./db";

export async function exportReceiptsToExcel(
  receipts: Receipt[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Receipt Tracker";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("收據記錄", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "日期", key: "date", width: 14 },
    { header: "商家", key: "merchant", width: 22 },
    { header: "描述", key: "title", width: 24 },
    { header: "金額", key: "amount", width: 14 },
    { header: "貨幣", key: "currency", width: 10 },
    { header: "分類", key: "category", width: 12 },
    { header: "備註", key: "notes", width: 28 },
    { header: "收據圖片", key: "image", width: 40 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 24;

  const uploadsDir = getUploadsDir();

  for (let i = 0; i < receipts.length; i++) {
    const receipt = receipts[i];
    const rowIndex = i + 2;

    sheet.addRow({
      date: receipt.date,
      merchant: receipt.merchant ?? "",
      title: receipt.title,
      amount: receipt.amount,
      currency: receipt.currency,
      category: receipt.category ?? "",
      notes: receipt.notes ?? "",
    });

    const row = sheet.getRow(rowIndex);
    row.height = 120;
    row.getCell(4).numFmt =
      receipt.currency === "JPY" ? "#,##0" : "#,##0.00";
    row.getCell(4).value = receipt.amount;

    const imagePath = path.join(uploadsDir, receipt.imagePath);
    if (fs.existsSync(imagePath)) {
      const ext = path.extname(receipt.imagePath).toLowerCase();
      const extension =
        ext === ".png" ? "png" : ext === ".webp" ? "webp" : "jpeg";

      const imageId = workbook.addImage({
        buffer: fs.readFileSync(imagePath) as unknown as ExcelJS.Buffer,
        extension: extension as "png" | "jpeg" | "gif",
      });

      sheet.addImage(imageId, {
        tl: { col: 7, row: rowIndex - 1 },
        ext: { width: 280, height: 140 },
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function getExportFilename(): string {
  return `收據記錄_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`;
}

export function summarizeForDisplay(receipts: Receipt[]) {
  const byCurrency: Record<string, { count: number; total: number }> = {};

  for (const r of receipts) {
    if (!byCurrency[r.currency]) {
      byCurrency[r.currency] = { count: 0, total: 0 };
    }
    byCurrency[r.currency].count += 1;
    byCurrency[r.currency].total += r.amount;
  }

  return {
    count: receipts.length,
    byCurrency: Object.entries(byCurrency).map(([currency, data]) => ({
      currency,
      count: data.count,
      total: data.total,
      formatted: formatAmount(data.total, currency as Receipt["currency"]),
    })),
  };
}
