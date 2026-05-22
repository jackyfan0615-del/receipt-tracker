"use client";

import { useCallback, useEffect, useState } from "react";
import { ReceiptCard } from "./ReceiptCard";
import type { Receipt } from "@/lib/types";
import { RefreshCw } from "lucide-react";

interface ReceiptListProps {
  editable?: boolean;
}

export function ReceiptList({ editable = false }: ReceiptListProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Receipt | null>(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/receipts");
      const data = await res.json();
      setReceipts(data);
    } catch {
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此記錄嗎？")) return;
    await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    fetchReceipts();
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;

    const form = new FormData(e.currentTarget);
    await fetch(`/api/receipts/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        amount: form.get("amount"),
        currency: form.get("currency"),
        category: form.get("category"),
        merchant: form.get("merchant"),
        date: form.get("date"),
        notes: form.get("notes"),
      }),
    });

    setEditing(null);
    fetchReceipts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
        載入中...
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
        <p className="text-slate-600">尚無收據記錄</p>
        <p className="mt-1 text-sm text-slate-400">上傳第一張收據開始記帳吧</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {receipts.map((receipt) => (
          <ReceiptCard
            key={receipt.id}
            receipt={receipt}
            onEdit={editable ? setEditing : undefined}
            onDelete={editable ? handleDelete : undefined}
          />
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">編輯記錄</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input
                name="title"
                defaultValue={editing.title}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="描述"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={editing.amount}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                  required
                />
                <select
                  name="currency"
                  defaultValue={editing.currency}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                >
                  <option value="HKD">HKD</option>
                  <option value="TWD">TWD</option>
                  <option value="USD">USD</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
              <input
                name="merchant"
                defaultValue={editing.merchant ?? ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="商家"
              />
              <input
                name="category"
                defaultValue={editing.category ?? ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="分類"
              />
              <input
                name="date"
                type="date"
                defaultValue={editing.date}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                required
              />
              <textarea
                name="notes"
                defaultValue={editing.notes ?? ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="備註"
                rows={2}
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 rounded-lg bg-slate-100 py-2.5 font-medium text-slate-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 font-medium text-white"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
