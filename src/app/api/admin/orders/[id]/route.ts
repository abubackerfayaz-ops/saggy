import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  adminEnabled,
  isValidSessionToken,
} from "@/lib/adminAuth";

type OrderStatus = (typeof ORDER_STATUSES)[number];
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!adminEnabled()) {
    return NextResponse.json({ error: "Admin access is not configured" }, { status: 404 });
  }
  if (!isValidSessionToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });

  let body: { status?: unknown; paymentStatus?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const data: { status?: OrderStatus; paymentStatus?: PaymentStatus } = {};

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !ORDER_STATUSES.includes(body.status as OrderStatus)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
    data.status = body.status as OrderStatus;
  }

  if (body.paymentStatus !== undefined) {
    if (
      typeof body.paymentStatus !== "string" ||
      !PAYMENT_STATUSES.includes(body.paymentStatus as PaymentStatus)
    ) {
      return NextResponse.json({ error: "Invalid payment status value" }, { status: 400 });
    }
    data.paymentStatus = body.paymentStatus as PaymentStatus;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data,
      select: { id: true, status: true, paymentStatus: true, updatedAt: true },
    });
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    console.error("[API /admin/orders/:id] Error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
