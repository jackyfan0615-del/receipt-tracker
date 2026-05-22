import { ReceiptList } from "@/components/ReceiptList";

export default function RecordsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">所有記錄</h1>
        <p className="mt-1 text-slate-600">
          每筆記錄皆附有收據原圖，可編輯或刪除
        </p>
      </div>
      <ReceiptList editable />
    </div>
  );
}
