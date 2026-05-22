"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, Image as ImageIcon, Loader2 } from "lucide-react";
import { formatAmount } from "@/lib/currencies";
import type { Receipt } from "@/lib/types";

export default function ExportPage() {
  const [count, setCount] = useState(0);
  const [summary, setSummary] = useState<
    { currency: string; count: number; formatted: string }[]
  >([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/receipts")
      .then((r) => r.json())
      .then((receipts: Receipt[]) => {
        setCount(receipts.length);
        const byCurrency: Record<string, { count: number; total: number }> = {};
        for (const r of receipts) {
          if (!byCurrency[r.currency]) {
            byCurrency[r.currency] = { count: 0, total: 0 };
          }
          byCurrency[r.currency].count += 1;
          byCurrency[r.currency].total += r.amount;
        }
        setSummary(
          Object.entries(byCurrency).map(([currency, data]) => ({
            currency,
            count: data.count,
            formatted: formatAmount(data.total, currency as Receipt["currency"]),
          }))
        );
      })
      .catch(() => {
        setCount(0);
        setSummary([]);
      });
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `收據記錄_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">匯出記錄</h1>
        <p className="mt-1 text-slate-600">
          匯出為 Excel 格式，包含金額資訊與收據圖片
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <FileSpreadsheet className="h-7 w-7" />
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Excel (.xlsx)</h2>
            <p className="mt-1 text-sm text-slate-600">
              包含日期、商家、金額、貨幣、分類、備註，以及每筆記錄的收據圖片
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                內嵌收據圖片
              </span>
              <span>共 {count} 筆記錄</span>
            </div>
            {summary.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {summary.map((s) => (
                  <span
                    key={s.currency}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                  >
                    {s.currency}: {s.formatted} ({s.count} 筆)
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || count === 0}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {exporting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              匯出中...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              下載 Excel 檔案
            </>
          )}
        </button>

        {count === 0 && (
          <p className="mt-3 text-sm text-slate-400">尚無記錄可匯出，請先上傳收據</p>
        )}
      </div>

      <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">跨裝置同步說明</p>
        <p className="mt-1 text-blue-700">
          將此系統部署至伺服器後，手機與電腦只需開啟同一網址，即可即時查看相同的收據記錄。
          本地開發時，同一 Wi-Fi 下的裝置可透過電腦 IP 位址存取（例如 http://192.168.1.100:3000）。
        </p>
      </div>
    </div>
  );
}
