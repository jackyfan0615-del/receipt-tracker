"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Sparkles, Upload } from "lucide-react";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currencies";
import type { Receipt, ReceiptAnalysis } from "@/lib/types";
import { ReceiptCard } from "./ReceiptCard";

export function ReceiptUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ReceiptAnalysis | null>(null);
  const [savedReceipt, setSavedReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
    setSavedReceipt(null);
    setError(null);
    setAnalysis(null);
    const url = URL.createObjectURL(selected);
    setPreview(url);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelect(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type.startsWith("image/")) {
      handleFileSelect(dropped);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      if (manualMode && analysis) {
        formData.append("manual", "true");
        formData.append("title", analysis.title);
        formData.append("amount", String(analysis.amount));
        formData.append("currency", analysis.currency);
        formData.append("category", analysis.category ?? "");
        formData.append("merchant", analysis.merchant ?? "");
        formData.append("date", analysis.date);
        formData.append("notes", analysis.notes ?? "");
      }

      const res = await fetch("/api/receipts/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "上傳失敗");
      }

      setAnalysis(data.analysis);
      setSavedReceipt(data.receipt);
      setManualMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setAnalysis(null);
    setSavedReceipt(null);
    setError(null);
    setManualMode(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const startManualEdit = () => {
    setManualMode(true);
    setAnalysis({
      title: "未命名收據",
      amount: 0,
      currency: DEFAULT_CURRENCY,
      category: "其他",
      merchant: null,
      date: new Date().toISOString().slice(0, 10),
      notes: null,
    });
  };

  return (
    <div className="space-y-6">
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-10 text-center transition-colors hover:border-blue-400 hover:bg-blue-50"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <Upload className="h-8 w-8" />
          </div>
          <p className="mt-4 text-lg font-medium text-slate-800">
            上傳收據圖片
          </p>
          <p className="mt-1 text-sm text-slate-500">
            拖放圖片至此，或點擊選擇檔案
          </p>
          <p className="mt-3 flex items-center justify-center gap-1 text-xs text-blue-600">
            <Sparkles className="h-3.5 w-3.5" />
            AI 將自動辨識金額、商家與日期
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative mx-auto aspect-[3/4] max-h-80 w-full max-w-xs overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src={preview}
              alt="收據預覽"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {!savedReceipt && !manualMode && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={uploadAndAnalyze}
                disabled={analyzing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    AI 辨識中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    AI 自動辨識並儲存
                  </>
                )}
              </button>
              <button
                onClick={startManualEdit}
                disabled={analyzing}
                className="rounded-xl border border-slate-200 bg-white py-3 px-4 font-medium text-slate-700 hover:bg-slate-50"
              >
                手動填寫
              </button>
              <button
                onClick={reset}
                className="rounded-xl border border-slate-200 bg-white py-3 px-4 font-medium text-slate-500 hover:bg-slate-50"
              >
                重選
              </button>
            </div>
          )}

          {manualMode && analysis && !savedReceipt && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <h3 className="font-semibold text-slate-800">手動填寫資訊</h3>
              <input
                value={analysis.title}
                onChange={(e) => setAnalysis({ ...analysis, title: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="描述"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={analysis.amount}
                  onChange={(e) =>
                    setAnalysis({ ...analysis, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="金額"
                />
                <select
                  value={analysis.currency}
                  onChange={(e) =>
                    setAnalysis({
                      ...analysis,
                      currency: e.target.value as ReceiptAnalysis["currency"],
                    })
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.label})
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={analysis.merchant ?? ""}
                onChange={(e) => setAnalysis({ ...analysis, merchant: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="商家"
              />
              <input
                value={analysis.category ?? ""}
                onChange={(e) => setAnalysis({ ...analysis, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="分類"
              />
              <input
                type="date"
                value={analysis.date}
                onChange={(e) => setAnalysis({ ...analysis, date: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={uploadAndAnalyze}
                  disabled={analyzing}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 font-medium text-white"
                >
                  {analyzing ? "儲存中..." : "儲存記錄"}
                </button>
                <button onClick={reset} className="rounded-xl bg-slate-100 px-4 py-2.5">
                  取消
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          {savedReceipt && (
            <div className="space-y-4">
              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                收據已成功記錄，圖片已自動附加！
              </div>
              <ReceiptCard receipt={savedReceipt} />
              <button
                onClick={reset}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                <Camera className="h-5 w-5" />
                繼續上傳下一張
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
