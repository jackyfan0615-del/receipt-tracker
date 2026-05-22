"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReceiptCard } from "@/components/ReceiptCard";
import { formatAmount } from "@/lib/currencies";
import type { Receipt } from "@/lib/types";
import { ArrowRight, Receipt as ReceiptIcon, TrendingUp, Upload } from "lucide-react";

interface Stats {
  totalCount: number;
  byCurrency: Record<string, number>;
  recent: Receipt[];
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          電子帳單系統
        </h1>
        <p className="mt-2 text-slate-600">
          上傳收據、AI 自動辨識，手機與電腦即時同步
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/upload"
          className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white shadow-lg shadow-blue-200 transition-transform hover:scale-[1.02]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Upload className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">上傳收據</p>
            <p className="text-sm text-blue-100">拍照或選擇圖片，AI 自動記帳</p>
          </div>
          <ArrowRight className="h-5 w-5 opacity-60 group-hover:opacity-100" />
        </Link>

        <Link
          href="/records"
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:scale-[1.02]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ReceiptIcon className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">查看記錄</p>
            <p className="text-sm text-slate-500">
              共 {stats?.totalCount ?? 0} 筆收據
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
        </Link>
      </section>

      {stats && stats.totalCount > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            支出統計
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(stats.byCurrency).map(([currency, total]) => (
              <div
                key={currency}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="text-sm text-slate-500">{currency}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatAmount(total, currency as Receipt["currency"])}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats && stats.recent.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">最近記錄</h2>
            <Link href="/records" className="text-sm font-medium text-blue-600 hover:underline">
              查看全部
            </Link>
          </div>
          <div className="space-y-4">
            {stats.recent.map((receipt) => (
              <ReceiptCard key={receipt.id} receipt={receipt} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
