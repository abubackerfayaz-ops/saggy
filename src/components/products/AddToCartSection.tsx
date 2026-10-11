"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ShoppingBag,
  Heart,
  Zap,
  X,
  CheckCircle,
  Printer,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";
import logo from "@/assets/saggy-logo.webp";
import qrPayment from "@/assets/qr-payment.png";
import CheckoutDetailsForm from "@/components/checkout/CheckoutDetailsForm";
import {
  calcShipping,
  placeOrder,
  type CheckoutDetails,
  type PlacedOrder,
} from "@/lib/checkout";

interface ProductInfo {
  id: string;
  slug: string;
  name: string;
  brand: string;
  sellingPrice: number;
  sourcePrice: number;
  markup: number;
  primaryImage: string;
}

interface VariantInfo {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  inStock: boolean;
}

interface AddToCartSectionProps {
  product: ProductInfo;
  availableSizes: string[];
  inStockSizes: string[];
  variants: VariantInfo[];
}

type FlowStep = "idle" | "details" | "qr" | "bill";

export default function AddToCartSection({
  product,
  availableSizes,
  inStockSizes,
  variants,
}: AddToCartSectionProps) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const [details, setDetails] = useState<CheckoutDetails | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const { addItem } = useCart();

  const selectedVariant = variants.find(
    (v) => v.size === selectedSize && v.inStock
  );

  const totalAmount = product.sellingPrice * quantity;
  const shipping = calcShipping(totalAmount);
  const grandTotal = totalAmount + shipping;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 1500);
      return;
    }
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        size: selectedSize,
        color: selectedVariant?.color ?? null,
        price: product.sellingPrice,
        image: product.primaryImage,
      },
      quantity
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 1500);
      return;
    }
    setPlaceError(null);
    setFlowStep("details");
  };

  const handleDetails = (next: CheckoutDetails) => {
    setDetails(next);
    setPlaceError(null);
    setFlowStep("qr");
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
        items: [
          {
            productId: product.id,
            variantId: selectedVariant?.id,
            size: selectedSize,
            color: selectedVariant?.color ?? null,
            quantity,
          },
        ],
        paymentMethod: "UPI",
      });
      setPlaced(order);
      setFlowStep("bill");
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
    setFlowStep("idle");
    setPlaceError(null);
    setPlacing(false);
    setPlaced(null);
    setDetails(null);
  };

  return (
    <>
      <div className="space-y-6 font-body">
        {/* Size Selector */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-heading uppercase tracking-wider text-white">
              Select Size
            </span>
            <button className="text-xs font-pill tracking-wider uppercase text-neutral-400 font-semibold hover:text-white underline">
              Size Chart
            </button>
          </div>

          {sizeError && (
            <p className="text-xs font-pill tracking-wide text-rose-400 font-semibold mb-2 animate-pulse">
              Please select an available size
            </p>
          )}

          <div className="grid grid-cols-5 gap-2">
            {availableSizes.map((size) => {
              const isInStock = inStockSizes.includes(size);
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => {
                    if (isInStock) {
                      setSelectedSize(size);
                      setSizeError(false);
                    }
                  }}
                  disabled={!isInStock}
                  aria-label={`Size ${size}${!isInStock ? " — out of stock" : ""}`}
                  className={`h-12 text-sm font-pill font-bold rounded-xl border transition-all flex items-center justify-center ${
                    isSelected
                      ? "bg-gradient-to-r from-[#FF2D88] to-[#FF5DAA] text-white border-[#FF5DAA] shadow-[0_0_12px_rgba(255,45,136,0.35)]"
                      : isInStock
                      ? "bg-[#141318] text-white border-white/10 hover:border-[#FF2D88]/40"
                      : "bg-[#0d0c10] text-neutral-600 border-white/5 cursor-not-allowed line-through"
                  } ${sizeError && !isSelected ? "border-[#FF2D88]" : ""}`}
                >
                  {size}
                </button>
              );
            })}
          </div>

          {selectedVariant && selectedVariant.color && (
            <p className="mt-2.5 text-xs font-label uppercase tracking-wider text-neutral-400">
              Color: <span className="font-bold text-white">{selectedVariant.color}</span>
            </p>
          )}
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-heading uppercase tracking-wider text-white">Qty</span>
          <div className="flex items-center bg-[#141318] border border-white/10 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center text-neutral-300 hover:bg-white/10 font-bold text-base transition-colors"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-price font-bold text-white">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className="w-10 h-10 flex items-center justify-center text-neutral-300 hover:bg-white/10 font-bold text-base transition-colors"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <div className="ml-auto flex items-baseline gap-1.5">
            <span className="text-xs font-label uppercase tracking-wider text-neutral-400">Total:</span>
            <span className="text-base font-price font-bold text-white">
              {formatPrice(totalAmount)}
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleAddToCart}
            className={`flex-1 h-13 flex items-center justify-center gap-2 text-sm font-cta font-bold tracking-widest uppercase rounded-2xl transition-all shadow-md active:scale-95 ${
              addedToCart
                ? "bg-emerald-600 text-white"
                : "bg-transparent border-2 border-white hover:border-[#FF2D88] text-white hover:text-[#FF2D88] hover:bg-white/5"
            }`}
            aria-label={addedToCart ? "Added to bag!" : "Add to bag"}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{addedToCart ? "ADDED TO BAG!" : "ADD TO BAG"}</span>
          </button>

          <button
            onClick={handleBuyNow}
            className="flex-1 h-13 flex items-center justify-center gap-2 text-sm font-cta font-bold tracking-widest uppercase rounded-2xl bg-gradient-to-r from-[#FF2D88] to-[#FF5DAA] hover:brightness-110 text-white transition-all shadow-[0_0_20px_rgba(255,45,136,0.35)] active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>BUY NOW</span>
          </button>

          <button
            onClick={() => setWishlisted((w) => !w)}
            aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            className={`h-13 w-13 flex items-center justify-center rounded-2xl border transition-all active:scale-95 shrink-0 shadow-md ${
              wishlisted
                ? "border-[#FF2D88] bg-[#FF2D88] text-white shadow-[0_0_12px_rgba(255,45,136,0.5)]"
                : "bg-[#141318] border-white/10 text-neutral-400 hover:text-white hover:border-[#FF2D88]/40"
            }`}
          >
            <Heart className={`w-5 h-5 ${wishlisted ? "fill-white" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── DELIVERY DETAILS MODAL ── */}
      {flowStep === "details" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="relative bg-[#111111] border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div>
                <p className="text-xs font-label uppercase tracking-widest text-neutral-400">Step 1 of 2</p>
                <h2 className="text-xl font-heading text-white mt-0.5 uppercase tracking-wide">Delivery Details</h2>
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
                Tell us where to ship <span className="text-white font-semibold">{product.name}</span>.
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
      {flowStep === "qr" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="relative bg-[#111111] border border-white/10 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => { setPlaceError(null); setFlowStep("details"); }}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Edit delivery details"
                >
                  <ArrowLeft className="w-4 h-4 text-neutral-400" />
                </button>
                <div>
                  <p className="text-xs font-label uppercase tracking-widest text-neutral-400">Step 2 of 2 · Pay via UPI</p>
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

            {/* Order summary strip */}
            <div className="px-6 py-3 bg-white/[0.03] border-b border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-body text-neutral-400 text-sm truncate max-w-[65%]">{product.name}</span>
                <span className="font-price font-bold text-white text-sm">{formatPrice(grandTotal)}</span>
              </div>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-xs text-neutral-500">Size: {selectedSize} · Qty: {quantity}</span>
                <span className="text-xs text-neutral-600 font-label uppercase tracking-wide">SAGGY</span>
              </div>
            </div>

            {/* QR */}
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
              <p className="text-xs font-label text-neutral-400 uppercase tracking-wider">Scan with any UPI app</p>
              <div className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-center">
                <p className="text-xs text-neutral-500 font-label mb-0.5">UPI ID</p>
                <p className="text-sm font-price font-bold text-white tracking-wider">abubackerfayaz-1@oksbi</p>
              </div>
              <div className="w-full flex items-center justify-between px-4 py-2 text-xs font-body text-neutral-400">
                <span>Item total</span>
                <span className="font-price text-white">{formatPrice(totalAmount)}</span>
              </div>
              <div className="w-full flex items-center justify-between px-4 pb-2 text-xs font-body text-neutral-400">
                <span>Delivery</span>
                <span className="font-price text-white">
                  {shipping === 0 ? <span className="text-emerald-400">FREE</span> : formatPrice(shipping)}
                </span>
              </div>
              <div className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl py-3">
                <span className="text-sm font-heading text-black uppercase tracking-wide">Amount:</span>
                <span className="text-lg font-price font-bold text-black">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Confirm */}
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
                {placing ? "Please don't close this window" : "Click only after completing payment in your UPI app"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── BILL / RECEIPT MODAL ── */}
      {flowStep === "bill" && placed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="relative bg-[#0F0F0F] border border-white/10 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10"
              aria-label="Close receipt"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Success header */}
            <div className="flex flex-col items-center pt-8 pb-5 px-6 border-b border-dashed border-white/10">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-heading text-white tracking-wide">Payment Received</h2>
              <p className="text-xs font-label text-neutral-400 mt-1 uppercase tracking-widest">Order Confirmed</p>
            </div>

            {/* Receipt */}
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
                { label: "Product", value: product.name },
                { label: "Brand", value: product.brand },
                { label: "Size", value: selectedSize },
                { label: "Quantity", value: `${quantity}` },
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
                  <span className="font-label uppercase tracking-wider text-neutral-500 text-xs">{label}</span>
                  <span className="font-body text-white text-right max-w-[58%] truncate">{value}</span>
                </div>
              ))}
              <div className="border-t border-dashed border-white/10" />
              <div className="flex justify-between text-sm">
                <span className="font-label uppercase tracking-wider text-neutral-500 text-xs">Unit Price</span>
                <span className="font-price text-white">{formatPrice(product.sellingPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-label uppercase tracking-wider text-neutral-500 text-xs">Item Total</span>
                <span className="font-price text-white">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2.5">
                <span className="font-heading uppercase tracking-wider text-white text-sm">Total Paid</span>
                <span className="font-price font-bold text-white text-xl">{formatPrice(placed.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-label uppercase tracking-wider text-neutral-500 text-xs">Payment</span>
                <span className="font-body text-emerald-400 text-xs font-semibold">UPI · PAID</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-2 border-t border-dashed border-white/10">
              <p className="text-xs text-neutral-500 text-center font-body mb-4">
                Thank you for shopping with SAGGY! Your order will be dispatched within 24–48 hrs.
              </p>
              <button
                onClick={() => window.print()}
                className="w-full h-11 flex items-center justify-center gap-2 border border-white/10 text-neutral-400 hover:text-white hover:border-white/30 text-xs font-cta font-bold uppercase tracking-widest rounded-2xl transition-all"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
