import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminEnabled } from "@/lib/adminAuth";

export async function POST() {
  if (!adminEnabled()) {
    return NextResponse.json({ error: "Admin access is not configured" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
