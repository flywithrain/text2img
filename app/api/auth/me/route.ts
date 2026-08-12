import { NextResponse } from "next/server";
import { getSessionPublicUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionPublicUser();
    return NextResponse.json(
      { user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: unknown) {
    console.error("me failed:", e);
    return NextResponse.json(
      { user: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
