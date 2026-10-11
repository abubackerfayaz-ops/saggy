"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Inbox,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export interface AdminOrderItem {
  id: string;
  productName: string;
  brandName: string;
  size: string;
  quantity: number;
  sellingPrice: number;
  totalPrice: number;
  imageUrl: string | null;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  notes: string | null;
  customer: { name: string; phone: string; email: string };
  address: { line1: string; line2: string | null; city: string; state: string; pinCode: string } | null;
  items: AdminOrderItem[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  PAYMENT_CONFIRMED: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  PROCESSING: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  PACKED: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
  SHIPPED: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  OUT_FOR_DELIVERY: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  DELIVERED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  CANCELLED: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  RETURNED: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  REFUNDED: "bg-rose-500/10 text-rose-300 border-rose-500/30",
};

const PAYMENT_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  PAID: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  FAILED: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  REFUNDED: "bg-rose-500/10 text-rose-300 border-rose-500/30",
};

const STATUS_OPTIONS = [
  "PENDING",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

const PAYMENT_OPTIONS = ["PENDING", "PAID", "FAILED", "REFUNDED"];

const PIPELINE: Record<string, { next: string; label: string }> = {
  PENDING: { next: "PAYMENT_CONFIRMED", label: "Confirm payment" },
  PAYMENT_CONFIRMED: { next: "PROCESSING", label: "Mark processing" },
  PROCESSING: { next: "PACKED", label: "Mark packed" },
  PACKED: { next: "SHIPPED", label: "Mark shipped" },
  SHIPPED: { next: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  OUT_FOR_DELIVERY: { next: "DELIVERED", label: "Mark delivered" },
};

const TO_SHIP_STATUSES = ["PENDING", "PAYMENT_CONFIRMED", "PROCESSING", "PACKED"];
const SHIP_STATUSES = ["SHIPPED", "OUT_FOR_DELIVERY"];
const CLOSED_STATUSES = ["CANCELLED", "RETURNED", "REFUNDED"];

type FilterKey = "all" | "verify" | "toship" | "shipped" | "delivered" | "closed";

function labelize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface AdminOrdersProps {
  orders: AdminOrder[];
  loadError: string | null;
}

export default function AdminOrders({ orders, loadError }: AdminOrdersProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const verify = orders.filter(
      (o) => o.paymentStatus === "PENDING" && !CLOSED_STATUSES.includes(o.status)
    ).length;
    const toship = orders.filter(
      (o) => o.paymentStatus === "PAID" && TO_SHIP_STATUSES.includes(o.status)
    ).length;
    const shipped = orders.filter((o) => SHIP_STATUSES.includes(o.status)).length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const closed = orders.filter((o) => CLOSED_STATUSES.includes(o.status)).length;
    const revenue = orders
      .filter((o) => o.paymentStatus === "PAID" && o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.total, 0);
    return { verify, toship, shipped, delivered, closed, revenue };
  }, [orders]);

  const visible = useMemo(() => {
    switch (filter) {
      case "verify":
        return orders.filter(
          (o) => o.paymentStatus === "PENDING" && !CLOSED_STATUSES.includes(o.status)
        );
      case "toship":
        return orders.filter(
          (o) => o.paymentStatus === "PAID" && TO_SHIP_STATUSES.includes(o.status)
        );
      case "shipped":
        return orders.filter((o) => SHIP_STATUSES.includes(o.status));
      case "delivered":
        return orders.filter((o) => o.status === "DELIVERED");
      case "closed":
        return orders.filter((o) => CLOSED_STATUSES.includes(o.status));
      default:
        return orders;
    }
  }, [orders, filter]);

  const updateOrder = async (
    id: string,
    patch: { status?: string; paymentStatus?: string }
  ) => {
    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Update failed");
      }
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not save the change");
    } finally {
      setBusyId(null);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  const tabs: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: orders.length },
    { key: "verify", label: "Check payment", count: counts.verify },
    { key: "toship", label: "To ship", count: counts.toship },
    { key: "shipped", label: "Shipped", count: counts.shipped },
    { key: "delivered", label: "Delivered", count: counts.delivered },
    { key: "closed", label: "Closed", count: counts.closed },
  ];

  const error = loadError || actionError;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-body">
      <header className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-label uppercase tracking-widest text-neutral-500">
              SAGGY · Admin
            </p>
            <h1 className="font-heading text-xl text-white uppercase tracking-wide">
              Orders <span className="font-price text-neutral-500 text-sm">({orders.length})</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.refresh()}
              className="h-9 px-3.5 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-cta font-bold uppercase tracking-widest transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={logout}
              className="h-9 px-3.5 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-cta font-bold uppercase tracking-widest transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Check payment" value={`${counts.verify}`} tone="amber" />
          <StatCard label="To ship" value={`${counts.toship}`} tone="sky" />
          <StatCard label="Shipped" value={`${counts.shipped}`} tone="violet" />
          <StatCard label="Paid revenue" value={formatPrice(counts.revenue)} tone="emerald" />
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-300 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`shrink-0 h-9 px-3.5 rounded-xl text-xs font-cta font-bold uppercase tracking-widest border transition-colors ${
                filter === tab.key
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-neutral-400 border-white/10 hover:text-white hover:border-white/25"
              }`}
            >
              {tab.label}
              <span className={filter === tab.key ? "text-neutral-500 ml-1.5" : "text-neutral-600 ml-1.5"}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Orders */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#121212] border border-white/10 rounded-3xl">
            <div className="w-14 h-14 rounded-2xl bg-[#1C1C1C] flex items-center justify-center mb-3">
              <Inbox className="w-7 h-7 text-neutral-500" />
            </div>
            <p className="font-heading text-lg text-white uppercase tracking-wide">No orders here</p>
            <p className="text-xs text-neutral-500 mt-1">
              {orders.length === 0
                ? "New customer orders will appear here instantly."
                : "Try another filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                busy={busyId === order.id}
                onUpdate={updateOrder}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "sky" | "violet" | "emerald";
}) {
  const tones = {
    amber: "border-amber-500/20 text-amber-300",
    sky: "border-sky-500/20 text-sky-300",
    violet: "border-violet-500/20 text-violet-300",
    emerald: "border-emerald-500/20 text-emerald-300",
  } as const;
  return (
    <div className={`bg-[#121212] border rounded-2xl px-4 py-3.5 ${tones[tone]}`}>
      <p className="text-[10px] font-label uppercase tracking-widest text-neutral-500">{label}</p>
      <p className="font-price font-bold text-white text-xl mt-1">{value}</p>
    </div>
  );
}

function OrderCard({
  order,
  busy,
  onUpdate,
}: {
  order: AdminOrder;
  busy: boolean;
  onUpdate: (id: string, patch: { status?: string; paymentStatus?: string }) => void;
}) {
  const pipeline = PIPELINE[order.status];
  const canMarkPaid = order.paymentStatus === "PENDING" && order.status === "PENDING";

  return (
    <article className="bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="font-price font-bold text-white text-sm">{order.orderNumber}</span>
          <span className="text-xs text-neutral-500">{formatDate(order.createdAt)}</span>
          <Badge value={order.status} styles={STATUS_STYLES} />
          <Badge value={order.paymentStatus} styles={PAYMENT_STYLES} />
        </div>
        <span className="font-price font-bold text-white text-lg">{formatPrice(order.total)}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 sm:p-5">
        {/* Customer */}
        <div className="space-y-3">
          <p className="text-[10px] font-label uppercase tracking-widest text-neutral-500">
            Customer
          </p>
          <p className="text-base font-semibold text-white">{order.customer.name}</p>
          <div className="space-y-1.5 text-sm text-neutral-300">
            {order.customer.phone && (
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <a href={`tel:${order.customer.phone}`} className="hover:text-white">
                  {order.customer.phone}
                </a>
              </p>
            )}
            {order.customer.email && (
              <p className="flex items-center gap-2 min-w-0">
                <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <a href={`mailto:${order.customer.email}`} className="hover:text-white truncate">
                  {order.customer.email}
                </a>
              </p>
            )}
            {order.address ? (
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {order.address.line1}
                  {order.address.line2 ? <>, {order.address.line2}</> : null}
                  <br />
                  {order.address.city}, {order.address.state} — {order.address.pinCode}
                </span>
              </p>
            ) : (
              <p className="text-neutral-500">No address saved</p>
            )}
          </div>
          <div className="text-xs text-neutral-500">
            {formatPrice(order.subtotal)} + {order.shippingFee === 0 ? "free delivery" : `${formatPrice(order.shippingFee)} delivery`}
            {order.discount > 0 ? ` − ${formatPrice(order.discount)} off` : ""}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <p className="text-[10px] font-label uppercase tracking-widest text-neutral-500">
            What to supply · {order.items.length} line{order.items.length === 1 ? "" : "s"}
          </p>
          <div className="space-y-2.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-11 h-14 rounded-lg overflow-hidden bg-[#1A1A1A] border border-white/5 shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                  ) : (
                    <Package className="w-4 h-4 text-neutral-600 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-semibold truncate">{item.productName}</p>
                  <p className="text-[10px] font-label uppercase tracking-wider text-neutral-500">
                    {item.brandName}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Size <span className="text-white font-bold">{item.size}</span> · Qty{" "}
                    <span className="text-white font-bold">{item.quantity}</span> ·{" "}
                    {formatPrice(item.sellingPrice)} each
                  </p>
                </div>
                <span className="font-price text-sm text-white shrink-0">
                  {formatPrice(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 sm:px-5 py-3.5 border-t border-white/10 bg-white/[0.02] flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="block text-[9px] font-label uppercase tracking-widest text-neutral-500 mb-1">
            Payment
          </span>
          <select
            value={order.paymentStatus}
            disabled={busy}
            onChange={(e) => onUpdate(order.id, { paymentStatus: e.target.value })}
            className="h-9 bg-[#0d0c10] border border-white/10 rounded-xl px-2.5 text-xs text-white font-body outline-none focus:border-[#FF2D88]/60 disabled:opacity-50"
          >
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-[#111111] text-white">
                {labelize(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-[9px] font-label uppercase tracking-widest text-neutral-500 mb-1">
            Order status
          </span>
          <select
            value={order.status}
            disabled={busy}
            onChange={(e) => onUpdate(order.id, { status: e.target.value })}
            className="h-9 bg-[#0d0c10] border border-white/10 rounded-xl px-2.5 text-xs text-white font-body outline-none focus:border-[#FF2D88]/60 disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-[#111111] text-white">
                {labelize(option)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2 ml-auto">
          {busy && (
            <span className="text-[11px] text-neutral-500 font-body animate-pulse">Saving…</span>
          )}
          {canMarkPaid && (
            <button
              disabled={busy}
              onClick={() =>
                onUpdate(order.id, { paymentStatus: "PAID", status: "PAYMENT_CONFIRMED" })
              }
              className="h-9 px-3.5 flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-cta font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Payment received
            </button>
          )}
          {pipeline && (
            <button
              disabled={busy}
              onClick={() =>
                onUpdate(
                  order.id,
                  order.status === "PENDING"
                    ? { status: pipeline.next, paymentStatus: "PAID" }
                    : { status: pipeline.next }
                )
              }
              className="h-9 px-3.5 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF2D88] to-[#FF5DAA] hover:brightness-110 text-white text-xs font-cta font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_16px_rgba(255,45,136,0.3)]"
            >
              {pipeline.label}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Badge({ value, styles }: { value: string; styles: Record<string, string> }) {
  return (
    <span
      className={`text-[10px] font-cta font-bold uppercase tracking-widest px-2 py-1 rounded-lg border ${
        styles[value] || "bg-white/5 text-neutral-300 border-white/15"
      }`}
    >
      {labelize(value)}
    </span>
  );
}
