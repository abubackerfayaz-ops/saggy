"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle,
  Printer,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart, type CartItem } from "@/components/cart/CartProvider";
import CheckoutDetailsForm from "@/components/checkout/CheckoutDetailsForm";
import logo from "@/assets/saggy-logo.webp";
import qrPayment from "@/assets/qr-payment.png";
import {
  calcShipping,
  placeOrder,
  type CheckoutDetails,
  type PlacedOrder,
} from "@/lib/checkout";

const FREE_SHIPPING_ABOVE = 999;

type Step = "details" | "qr" | "paid";

export default function CartPage() {
  const { items, count, total, hydrated, updateQuantity, removeItem, clearCart } =
    useCart();
  const [checkout, setCheckout] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [details, setDetails] = useState<CheckoutDetails | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const shipping = calcShipping(total);
  const grandTotal = total + shipping;

  const openCheckout = () => {
    setStep("details");
    setPlaceError(null);
    setPlacing(false);
    setCheckout(true);
  };

  const handleDetails = (next: CheckoutDetails) => {
    setDetails(next);
    setPlaceError(null);
    setStep("qr");
  };

  const handlePaid = async () => {
    if (placing) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const order = await placeOrder({
        customer: {
          name: details?.name ?? "",
          phone: details?.phone ?? "",
          email: details?.email ?? "",
        },
        address: {
          line1: details?.line1 ?? "",
          line2: details?.line2 || undefined,
          city: details?.city ?? "",
          state: details?.state ?? "",
          pinCode: details?.pinCode ?? "",
        },
        items: items.map((i) => ({
          productId: i.productId,
          size: i.size,
          color: i.color ?? null,
          quantity: i.quantity,
        })),
        paymentMethod: "UPI",
      });
      setPlaced(order);
      clearCart();
      setStep("paid");
    } catch (error) {
      setPlaceError(
        error instanceof Error
          ? error.message
          : "Network error. Check your connection and try again."
      );
    } finally {
      setPlacing(false);
    }
  };

  const handleClose = () => {
    setCheckout(false);
    setStep("details");
    setDetails(null);
    setPlaced(null);
    setPlaceError(null);
    setPlacing(false);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-body">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-2 text-xs font-pill font-bold text-neutral-400 uppercase tracking-widest mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Your Bag</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl text-white uppercase tracking-wide">
            Shopping Bag{" "}
            <span className="font-price text-neutral-500 text-2xl">({count})</span>
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {items.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-24 text-center bg-[#121212] rounded-3xl border border-white/10 p-8 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-[#1C1C1C] flex items-center justify-center mb-4 text-neutral-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-2xl text-white mb-1 uppercase tracking-wide">
              Your bag is empty
            </h2>
            <p className="font-body text-xs text-neutral-400 max-w-sm mb-6">
              Browse 300+ curated drops and add your favourites.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-7 py-3 bg-white hover:bg-neutral-200 text-black font-cta font-bold text-sm tracking-widest rounded-full transition-all active:scale-95 uppercase"
            >
              <span>Start Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* ── Items List ── */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <CartItemRow
                  key={item.key}
                  item={item}
                  onQty={updateQuantity}
                  onRemove={removeItem}
                />
              ))}

              <div className="flex items-center justify-between pt-4">
                <Link
                  href="/shop"
                  className="text-xs font-pill uppercase tracking-widest font-bold text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  Continue Shopping
                </Link>
                <button
                  onClick={clearCart}
                  className="text-xs font-pill uppercase tracking-widest font-bold text-neutral-500 hover:text-rose-400 transition-colors"
                >
                  Clear Bag
                </button>
              </div>
            </div>

            {/* ── Order Summary ── */}
            <div className="lg:col-span-1">
              <div className="bg-[#121212] rounded-3xl border border-white/10 p-6 shadow-xl sticky top-28 space-y-4">
                <h2 className="font-heading text-lg text-white uppercase tracking-wider">
                  Order Summary
                </h2>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-body">Subtotal</span>
                    <span className="font-price text-white">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-body">Delivery</span>
                    <span className="font-price text-white">
                      {shipping === 0 ? (
                        <span className="text-emerald-400">FREE</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-[11px] text-neutral-500 font-body">
                      Add {formatPrice(FREE_SHIPPING_ABOVE - total)} more for free
                      delivery.
                    </p>
                  )}
                </div>

                <div className="border-t border-dashed border-white/10 pt-3 flex justify-between items-center">
                  <span className="font-heading uppercase tracking-wider text-white text-sm">
                    Total
                  </span>
                  <span className="font-price font-bold text-white text-2xl">
                    {formatPrice(grandTotal)}
                  </span>
                </div>

                <button
                  onClick={openCheckout}
                  className="w-full h-13 flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF2D88] to-[#FF5DAA] hover:brightness-110 text-white font-cta font-bold text-sm tracking-widest uppercase rounded-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(255,45,136,0.35)]"
                >
                  Proceed to Pay
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-2 pt-1">
                  <p className="text-[11px] text-neutral-500 font-body leading-relaxed">
                    7-day easy returns · Pan-India express delivery
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── DELIVERY DETAILS MODAL ── */}
      {checkout && step === "details" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="relative bg-[#111111] border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div>
                <p className="text-xs font-label uppercase tracking-widest text-neutral-400">
                  Step 1 of 2
                </p>
                <h2 className="text-xl font-heading text-white mt-0.5 uppercase tracking-wide">
                  Delivery Details
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Close checkout"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              <p className="text-xs font-body text-neutral-500 mb-4">
                Tell us where to ship your order — we&apos;ll only use this to deliver it.
              </p>
              <CheckoutDetailsForm
                onSubmit={handleDetails}
                submitLabel="Continue to Payment"
                footer={
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full text-xs font-cta font-bold uppercase tracking-widest text-neutral-500 hover:text-white py-1 transition-colors"
                  >
                    Cancel
                  </button>
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* ── QR PAYMENT MODAL ── */}
      {checkout && step === "qr" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="relative bg-[#111111] border border-white/10 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setStep("details")}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    aria-label="Edit delivery details"
                  >
                    <ArrowLeft className="w-4 h-4 text-neutral-400" />
                  </button>
                  <div>
                    <p className="text-xs font-label uppercase tracking-widest text-neutral-400">
                      Step 2 of 2 · Pay via UPI
                    </p>
                    <h2 className="text-xl font-heading text-white mt-0.5">Scan &amp; Pay</h2>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Close payment"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              <div className="px-6 py-3 bg-white/[0.03] border-b border-white/5">
                <div className="flex justify-between items-center">
                  <span className="font-body text-neutral-400 text-sm truncate max-w-[65%]">
                    {count} item{count > 1 ? "s" : ""} in bag
                  </span>
                  <span className="font-price font-bold text-white text-sm">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-xs text-neutral-500 truncate max-w-[65%]">
                    {details?.name}
                    {details?.city ? ` · ${details.city}` : ""}
                  </span>
                  <span className="text-xs text-neutral-600 font-label uppercase tracking-wide">
                    SAGGY
                  </span>
                </div>
              </div>

            <div className="px-6 py-5 flex flex-col items-center gap-4">
              <div className="relative w-52 h-52 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                <Image
                  src={qrPayment}
                  alt="UPI QR Code — Scan to pay"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <p className="text-xs font-label text-neutral-400 uppercase tracking-wider">
                Scan with any UPI app
              </p>
              <div className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-center">
                <p className="text-xs text-neutral-500 font-label mb-0.5">UPI ID</p>
                <p className="text-sm font-price font-bold text-white tracking-wider">
                  abubackerfayaz-1@oksbi
                </p>
              </div>
              <div className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl py-3">
                <span className="text-sm font-heading text-black uppercase tracking-wide">
                  Amount:
                </span>
                <span className="text-lg font-price font-bold text-black">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            <div className="px-6 pb-6">
              {placeError && (
                <div className="mb-3 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3.5 py-3">
                  <p className="text-xs text-rose-400 font-body leading-relaxed">{placeError}</p>
                  <p className="text-[11px] text-neutral-500 font-body mt-1">
                    Your payment is safe — retry to save the order.
                  </p>
                </div>
              )}
              <button
                onClick={handlePaid}
                disabled={placing}
                className="w-full h-13 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-cta font-bold text-sm uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg disabled:opacity-70"
              >
                {placing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Order…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    I&apos;VE PAID
                  </>
                )}
              </button>
              <p className="text-xs text-neutral-600 text-center mt-3 font-body">
                {placing
                  ? "Please don't close this window"
                  : "Click only after completing payment in your UPI app"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIPT MODAL ── */}
      {checkout && step === "paid" && placed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="relative bg-[#0F0F0F] border border-white/10 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10"
              aria-label="Close receipt"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>

            <div className="flex flex-col items-center pt-8 pb-5 px-6 border-b border-dashed border-white/10">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-heading text-white tracking-wide">
                Payment Received
              </h2>
              <p className="text-xs font-label text-neutral-400 mt-1 uppercase tracking-widest">
                Order Confirmed
              </p>
            </div>

            <div className="px-6 py-5 space-y-3">
              <div className="text-center mb-2 flex flex-col items-center">
                <div className="relative h-10 w-[120px] mb-1">
                  <Image
                    src={logo}
                    alt="SAGGY"
                    fill
                    unoptimized
                    className="object-contain mix-blend-screen"
                    sizes="120px"
                  />
                </div>
                <p className="text-xs text-neutral-500 font-body">Official Receipt</p>
              </div>
              <div className="border-t border-dashed border-white/10" />
              {[
                { label: "Order #", value: placed.orderNumber },
                {
                  label: "Date",
                  value: new Date(placed.createdAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  }),
                },
                { label: "Items", value: `${placed.itemCount}` },
                {
                  label: "Delivery",
                  value: placed.shippingFee === 0 ? "Free" : formatPrice(placed.shippingFee),
                },
                {
                  label: "Ship to",
                  value: `${details?.city ?? ""} ${details?.pinCode ?? ""}`.trim() || "—",
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="font-label uppercase tracking-wider text-neutral-500 text-xs">
                    {label}
                  </span>
                  <span className="font-body text-white text-right max-w-[58%] truncate">
                    {value}
                  </span>
                </div>
              ))}
              <div className="border-t border-dashed border-white/10" />
              <div className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2.5">
                <span className="font-heading uppercase tracking-wider text-white text-sm">
                  Total Paid
                </span>
                <span className="font-price font-bold text-white text-xl">
                  {formatPrice(placed.total)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-label uppercase tracking-wider text-neutral-500 text-xs">
                  Payment
                </span>
                <span className="font-body text-emerald-400 text-xs font-semibold">
                  UPI · PAID
                </span>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 border-t border-dashed border-white/10">
              <p className="text-xs text-neutral-500 text-center font-body mb-4">
                Thank you for shopping with SAGGY! Your order will be dispatched within
                24–48 hrs.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 h-11 flex items-center justify-center gap-2 border border-white/10 text-neutral-400 hover:text-white hover:border-white/30 text-xs font-cta font-bold uppercase tracking-widest rounded-2xl transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 h-11 flex items-center justify-center gap-2 bg-white text-black text-xs font-cta font-bold uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartItemRow({
  item,
  onQty,
  onRemove,
}: {
  item: CartItem;
  onQty: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
}) {
  return (
    <div className="flex gap-4 bg-[#121212] border border-white/10 rounded-2xl p-4 shadow-sm">
      <Link
        href={`/shop/${item.slug}`}
        className="relative w-20 h-24 sm:w-24 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-[#1A1A1A] border border-white/5"
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover object-top"
          sizes="96px"
        />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-label font-bold uppercase tracking-widest text-neutral-500">
              {item.brand}
            </p>
            <Link
              href={`/shop/${item.slug}`}
              className="font-product text-sm sm:text-base font-bold text-white group-hover:text-[#FF2D88] hover:text-[#FF2D88] transition-colors line-clamp-2 block"
            >
              {item.name}
            </Link>
            <p className="text-xs font-pill uppercase tracking-wider text-neutral-400 mt-1">
              Size: <span className="text-white font-bold">{item.size}</span>
              {item.color ? ` · ${item.color}` : ""}
            </p>
          </div>
          <button
            onClick={() => onRemove(item.key)}
            className="p-2 text-neutral-500 hover:text-rose-400 transition-colors shrink-0"
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-center bg-[#1A1A1A] border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => onQty(item.key, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-neutral-300 hover:bg-white/10 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-price font-bold text-white">
              {item.quantity}
            </span>
            <button
              onClick={() => onQty(item.key, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-neutral-300 hover:bg-white/10 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-right">
            <p className="font-price font-bold text-white text-base">
              {formatPrice(item.price * item.quantity)}
            </p>
            {item.quantity > 1 && (
              <p className="text-[10px] text-neutral-500 font-body">
                {formatPrice(item.price)} each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
