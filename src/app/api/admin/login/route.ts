import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  adminEnabled,
  createSessionToken,
  verifyPassword,
} from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  if (!adminEnabled()) {
    return NextResponse.json({ error: "Admin access is not configured" }, { status: 404 });
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
