"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag, Heart, Zap, X, CheckCircle, Printer } from "lucide-react";
import { formatPrice } from "@/lib/utils";

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

type FlowStep = "idle" | "qr" | "bill";

function generateOrderId() {
  return "SLG" + Date.now().toString(36).toUpperCase();
}

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
  const [orderId] = useState(generateOrderId);
  const [orderTime] = useState(() =>
    new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  );

  const selectedVariant = variants.find(
    (v) => v.size === selectedSize && v.inStock
  );

  const totalAmount = product.sellingPrice * quantity;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 1500);
      return;
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 1500);
      return;
    }
    setFlowStep("qr");
  };

  const handlePaid = () => setFlowStep("bill");
  const handleClose = () => setFlowStep("idle");

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
                      ? "bg-white text-black border-white shadow-md"
                      : isInStock
                      ? "bg-[#161616] text-white border-white/10 hover:border-white/30"
                      : "bg-[#111111] text-neutral-600 border-white/5 cursor-not-allowed line-through"
                  } ${sizeError && !isSelected ? "border-rose-400" : ""}`}
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
          <div className="flex items-center bg-[#161616] border border-white/10 rounded-xl overflow-hidden shadow-sm">
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
                : "bg-transparent border-2 border-white text-white hover:bg-white/10"
            }`}
            aria-label={addedToCart ? "Added to bag!" : "Add to bag"}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{addedToCart ? "ADDED TO BAG!" : "ADD TO BAG"}</span>
          </button>

          <button
            onClick={handleBuyNow}
            className="flex-1 h-13 flex items-center justify-center gap-2 text-sm font-cta font-bold tracking-widest uppercase rounded-2xl bg-white hover:bg-neutral-200 text-black transition-all shadow-xl active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>BUY NOW</span>
          </button>

          <button
            onClick={() => setWishlisted((w) => !w)}
            aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            className={`h-13 w-13 flex items-center justify-center rounded-2xl border transition-all active:scale-95 shrink-0 shadow-md ${
              wishlisted
                ? "border-rose-500 bg-rose-500 text-white"
                : "bg-[#161616] border-white/10 text-neutral-400 hover:text-white hover:border-white/30"
            }`}
          >
            <Heart className={`w-5 h-5 ${wishlisted ? "fill-white" : ""}`} />
          </button>
        </div>
      </div>

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
              <div>
                <p className="text-xs font-label uppercase tracking-widest text-neutral-400">Pay via UPI</p>
                <h2 className="text-xl font-heading text-white mt-0.5">Scan &amp; Pay</h2>
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
                <span className="font-price font-bold text-white text-sm">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-xs text-neutral-500">Size: {selectedSize} · Qty: {quantity}</span>
                <span className="text-xs text-neutral-600 font-label uppercase tracking-wide">#{orderId}</span>
              </div>
            </div>

            {/* QR */}
            <div className="px-6 py-5 flex flex-col items-center gap-4">
              <div className="relative w-52 h-52 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                <Image
                  src="/qr-payment.png"
                  alt="UPI QR Code — Scan to pay"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-xs font-label text-neutral-400 uppercase tracking-wider">Scan with any UPI app</p>
              <div className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-center">
                <p className="text-xs text-neutral-500 font-label mb-0.5">UPI ID</p>
                <p className="text-sm font-price font-bold text-white tracking-wider">abubackerfayaz-1@oksbi</p>
              </div>
              <div className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl py-3">
                <span className="text-sm font-heading text-black uppercase tracking-wide">Amount:</span>
                <span className="text-lg font-price font-bold text-black">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {/* Confirm */}
            <div className="px-6 pb-6">
              <button
                onClick={handlePaid}
                className="w-full h-13 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-cta font-bold text-sm uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg"
              >
                <CheckCircle className="w-4 h-4" />
                I&apos;VE PAID
              </button>
              <p className="text-xs text-neutral-600 text-center mt-3 font-body">
                Click only after completing payment in your UPI app
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── BILL / RECEIPT MODAL ── */}
      {flowStep === "bill" && (
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
              <div className="text-center mb-2">
                <p className="text-lg font-heading text-white tracking-widest uppercase">SAGGY</p>
                <p className="text-xs text-neutral-500 font-body">Official Receipt</p>
              </div>
              <div className="border-t border-dashed border-white/10" />
              {[
                { label: "Order ID", value: `#${orderId}` },
                { label: "Date", value: orderTime },
                { label: "Product", value: product.name },
                { label: "Brand", value: product.brand },
                { label: "Size", value: selectedSize },
                { label: "Quantity", value: `${quantity}` },
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
              <div className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2.5">
                <span className="font-heading uppercase tracking-wider text-white text-sm">Total Paid</span>
                <span className="font-price font-bold text-white text-xl">{formatPrice(totalAmount)}</span>
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
