import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getReceipt, getUploadsDir } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const receipt = getReceipt(id);

  if (!receipt) {
    return NextResponse.json({ error: "找不到此記錄" }, { status: 404 });
  }

  const imagePath = path.join(getUploadsDir(), receipt.imagePath);

  if (!fs.existsSync(imagePath)) {
    return NextResponse.json({ error: "收據圖片不存在" }, { status: 404 });
  }

  const ext = path.extname(receipt.imagePath).toLowerCase();
  const contentType = MIME_MAP[ext] ?? "image/jpeg";
  const buffer = fs.readFileSync(imagePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
