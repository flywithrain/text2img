import { NextRequest, NextResponse } from "next/server";
import { readBlob } from "@/lib/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  try {
    const { body, contentType } = await readBlob(path);
    if (!body) {
      return NextResponse.json({ error: "blob not found" }, { status: 404 });
    }

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType ?? "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (e: any) {
    console.error("blob read failed:", e?.message);
    return NextResponse.json({ error: "读取失败" }, { status: 500 });
  }
}
