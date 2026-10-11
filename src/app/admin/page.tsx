import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, adminEnabled, isValidSessionToken } from "@/lib/adminAuth";
import AdminOrders, { type AdminOrder } from "@/components/admin/AdminOrders";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Orders · SAGGY Admin",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  if (!adminEnabled()) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-neutral-400 font-body flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-[#111111] border border-white/10 rounded-3xl p-8">
          <h1 className="font-heading text-2xl text-white uppercase tracking-wide mb-2">
            Admin Not Configured
          </h1>
          <p className="text-sm leading-relaxed">
            Set <code className="text-[#FF2D88]">ADMIN_PASSWORD</code> in your hosting
            environment to enable this dashboard.
          </p>
        </div>
      </div>
    );
  }

  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");

  let orders: AdminOrder[] = [];
  let loadError: string | null = null;

  try {
    const rows = await prisma.order.findMany({
      include: { items: true, shippingAddress: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    orders = rows.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      discount: order.discount,
      total: order.total,
      notes: order.notes,
      customer: {
        name: order.guestName ?? "—",
        phone: order.guestPhone ?? "",
        email: order.guestEmail ?? "",
      },
      address: order.shippingAddress
        ? {
            line1: order.shippingAddress.addressLine1,
            line2: order.shippingAddress.addressLine2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            pinCode: order.shippingAddress.pinCode,
          }
        : null,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        brandName: item.brandName,
        size: item.size,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        totalPrice: item.totalPrice,
        imageUrl: item.imageUrl,
      })),
    }));
  } catch (error) {
    console.error("[admin] Failed to load orders:", error);
    loadError = "Could not load orders right now. Check the database connection and refresh.";
  }

  return <AdminOrders orders={orders} loadError={loadError} />;
}
