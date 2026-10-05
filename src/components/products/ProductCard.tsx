"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Product, ProductImage, ProductVariant, Category } from "@prisma/client";

type ProductWithRelations = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
  category: Category | null;
};

interface ProductCardProps {
  product: ProductWithRelations;
}

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"];

export default function ProductCard({ product }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [hovering, setHovering] = useState(false);

  const primaryImage =
    product.images[0]?.url ??
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80";
  const hoverImage = product.images[1]?.url ?? primaryImage;

  const availableSizes = product.variants
    .filter((v) => v.inStock)
    .map((v) => v.size)
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));



  return (
    <article className="cc-card p-3 sm:p-3.5 flex flex-col group relative bg-[#121212] border border-white/10 rounded-2xl hover:border-white/30 hover:shadow-[0_16px_36px_rgba(0,0,0,0.7)] transition-all">
      {/* ── Image Container (Culture Circle Clean Style) ────────────────── */}
      <div
        className="relative aspect-[3/4] bg-[#181818] rounded-xl overflow-hidden"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <Image
          src={hovering && hoverImage !== primaryImage ? hoverImage : primaryImage}
          alt={product.name}
          fill
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Wishlist Button (Top Right) */}
        <button
          type="button"
          onClick={() => setWishlisted((w) => !w)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
            wishlisted
              ? "bg-rose-500 text-white"
              : "bg-black/60 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/90"
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-white" : ""}`} />
        </button>

        {/* Available Sizes Strip on Hover */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-[#121212]/95 backdrop-blur-md px-3 py-2 flex items-center justify-between border-t border-white/10 transition-all duration-200 ${
            hovering ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          }`}
        >
          <span className="text-[10px] font-pill font-bold text-neutral-400 uppercase tracking-widest">Sizes:</span>
          <div className="flex gap-1 flex-wrap justify-end">
            {availableSizes.length > 0 ? (
              availableSizes.slice(0, 5).map((size) => (
                <span
                  key={size}
                  className="px-1.5 py-0.5 text-[10px] font-bold border border-white/15 rounded text-white bg-[#222222] font-pill"
                >
                  {size}
                </span>
              ))
            ) : (
              <span className="text-[10px] font-body text-neutral-500">Out of stock</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Product Info (Culture Circle Clean Typography) ──────────────── */}
      <div className="pt-3 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          {/* Brand */}
          <span className="font-label font-bold text-neutral-400 uppercase tracking-widest truncate block text-[11px]">
            {product.brand}
          </span>

          {/* Product Title */}
          <Link href={`/shop/${product.slug}`} className="block mt-1">
            <h3 className="font-product text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2 hover:underline">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* ── Lowest Price & Action ───────────── */}
        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-label text-neutral-400 block uppercase tracking-widest">
              Lowest Price
            </span>
            <span className="font-price text-lg sm:text-xl font-bold text-white">
              {formatPrice(product.sellingPrice)}
            </span>
          </div>

          <Link
            href={`/shop/${product.slug}`}
            className="py-2 px-3.5 bg-white hover:bg-neutral-200 text-black font-cta text-sm tracking-widest rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95 shrink-0 shadow-md uppercase"
          >
            <span>VIEW DEALS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
