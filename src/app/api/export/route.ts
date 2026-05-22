import { NextResponse } from "next/server";
import { listReceipts } from "@/lib/db";
import { exportReceiptsToExcel, getExportFilename } from "@/lib/export";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const receipts = listReceipts();
    const buffer = await exportReceiptsToExcel(receipts);
    const filename = getExportFilename();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "匯出失敗" }, { status: 500 });
  }
}
