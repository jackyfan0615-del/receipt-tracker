import { NextResponse } from "next/server";
import { listReceipts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const receipts = listReceipts();
    return NextResponse.json(receipts);
  } catch (error) {
    console.error("Failed to list receipts:", error);
    return NextResponse.json(
      { error: "無法讀取收據記錄" },
      { status: 500 }
    );
  }
}
