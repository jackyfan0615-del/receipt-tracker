import { ReceiptUpload } from "@/components/ReceiptUpload";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">上傳收據</h1>
        <p className="mt-1 text-slate-600">
          拍照或上傳收據圖片，系統將自動辨識並附加圖片至記錄
        </p>
      </div>
      <ReceiptUpload />
    </div>
  );
}
