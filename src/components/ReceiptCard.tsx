import { formatAmount } from "@/lib/currencies";
import type { Receipt } from "@/lib/types";
import { Calendar, Store, Tag } from "lucide-react";
import Image from "next/image";

interface ReceiptCardProps {
  receipt: Receipt;
  onEdit?: (receipt: Receipt) => void;
  onDelete?: (id: string) => void;
}

export function ReceiptCard({ receipt, onEdit, onDelete }: ReceiptCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-48 w-full shrink-0 bg-slate-100 sm:h-auto sm:w-40">
          <Image
            src={`/api/receipts/${receipt.id}/image`}
            alt={receipt.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 160px"
            unoptimized
          />
        </div>
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900">{receipt.title}</h3>
              <p className="shrink-0 text-lg font-bold text-blue-600">
                {formatAmount(receipt.amount, receipt.currency)}
              </p>
            </div>
            {receipt.merchant && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                <Store className="h-3.5 w-3.5" />
                {receipt.merchant}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {receipt.date}
              </span>
              {receipt.category && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {receipt.category}
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                {receipt.currency}
              </span>
            </div>
            {receipt.notes && (
              <p className="mt-2 text-sm text-slate-500 line-clamp-2">{receipt.notes}</p>
            )}
          </div>
          {(onEdit || onDelete) && (
            <div className="mt-3 flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(receipt)}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  編輯
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(receipt.id)}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  刪除
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
