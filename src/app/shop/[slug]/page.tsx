import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import AddToCartSection from "@/components/products/AddToCartSection";
import {
  Star, Package, Truck, RotateCcw, Info,
  ChevronRight, Layers, Ruler, Shirt
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let product = null;
  try {
    product = await prisma.product.findUnique({
      where: { slug },
      select: { name: true, brand: true, description: true, sellingPrice: true },
    });
  } catch (error) {
    console.error("[Product metadata] Failed:", error);
  }

  if (!product) return { title: "Product Not Found | SAGGY" };

  return {
    title: `${product.name} by ${product.brand} | SAGGY`,
    description:
      product.description ??
      `Buy ${product.name} by ${product.brand} at ${formatPrice(product.sellingPrice)}. Curated shirts at the guaranteed lowest price.`,
    openGraph: {
      title: `${product.name} | SAGGY`,
      description: product.description ?? "",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product;
  try {
    product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { size: "asc" } },
        category: true,
        reviews: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
  } catch (error) {
    console.error("[Product page] Failed to load:", error);
    notFound();
  }

  if (!product || !product.isActive) {
    notFound();
  }

  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const sizeRank = (s: string) => {
    const i = SIZE_ORDER.indexOf(s);
    return i === -1 ? SIZE_ORDER.length : i;
  };

  let availableSizes = [
    ...new Set(product.variants.map((v) => v.size)),
  ].sort((a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b));
  let inStockSizes = product.variants
    .filter((v) => v.inStock)
    .map((v) => v.size);

  // Fallback: products without migrated variants still need selectable sizes
  if (availableSizes.length === 0) {
    availableSizes = ["S", "M", "L", "XL", "XXL"];
    inStockSizes = [...availableSizes];
  } else if (inStockSizes.length === 0) {
    inStockSizes = [...availableSizes];
  }

  const primaryImage =
    product.images[0]?.url ??
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-body">
      {/* ── Breadcrumb Bar ──────────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-[#111111]">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 font-pill uppercase tracking-wider" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-xs text-neutral-400">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><ChevronRight className="w-3.5 h-3.5 text-neutral-600" /></li>
            <li><Link href="/shop" className="hover:text-white transition-colors">Shop</Link></li>
            {product.category && (
              <>
                <li><ChevronRight className="w-3.5 h-3.5 text-neutral-600" /></li>
                <li>
                  <Link href={`/shop?category=${product.category.name}`} className="hover:text-white transition-colors">
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li><ChevronRight className="w-3.5 h-3.5 text-neutral-600" /></li>
            <li className="text-white font-semibold truncate max-w-[200px] normal-case">{product.name}</li>
          </ol>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">

          {/* LEFT: Product Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-[#121212] border border-white/10 shadow-xl">
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                priority
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Thumbnail Carousel */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <div
                    key={img.id}
                    className="relative w-20 h-24 shrink-0 rounded-2xl overflow-hidden bg-[#121212] border border-white/10 hover:border-white transition-colors cursor-pointer"
                  >
                    <Image
                      src={img.url}
                      alt={img.altText ?? `${product.name} view ${i + 1}`}
                      fill
                      className="object-cover object-top"
                      sizes="80px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Details (Culture Circle Marketplace Style) */}
          <div className="space-y-6">
            {/* Brand */}
            <div>
              <span className="text-xs font-label font-bold uppercase tracking-widest text-neutral-400">
                {product.brand}
              </span>
              {product.category && (
                <Link
                  href={`/shop?category=${product.category.name}`}
                  className="ml-2 text-xs font-pill uppercase tracking-wider text-neutral-500 hover:text-white transition-colors"
                >
                  / {product.category.name}
                </Link>
              )}
            </div>

            {/* Title */}
            <h1 className="font-product text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              {product.name}
            </h1>

            {/* Price Box */}
            <div className="bg-[#121212] rounded-3xl p-6 border border-white/10 shadow-xl space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-label font-bold text-neutral-400 block uppercase tracking-wider">
                    Lowest Price
                  </span>
                  <span className="text-3xl sm:text-4xl font-price font-bold text-white">
                    {formatPrice(product.sellingPrice)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-label text-neutral-500 block uppercase tracking-wider">Retail Est.</span>
                  <span className="text-base font-price font-semibold text-neutral-500 line-through">
                    {formatPrice(product.sourcePrice + 400)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-body text-neutral-400 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span>All taxes included · Best price guaranteed across marketplaces</span>
              </div>
            </div>

            {/* Size & Add to Cart Client Component */}
            <AddToCartSection
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                brand: product.brand,
                sellingPrice: product.sellingPrice,
                sourcePrice: product.sourcePrice,
                markup: product.markup,
                primaryImage,
              }}
              availableSizes={availableSizes}
              inStockSizes={inStockSizes}
              variants={product.variants.map((v) => ({
                id: v.id,
                size: v.size,
                color: v.color,
                stock: v.stock,
                inStock: v.inStock,
              }))}
            />

            {/* Product Attributes Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {product.fit && (
                <div className="flex items-center gap-3 p-3.5 bg-[#121212] rounded-2xl border border-white/10 shadow-sm">
                  <Shirt className="w-4 h-4 text-white" />
                  <div>
                    <span className="text-[10px] font-label uppercase font-bold text-neutral-400 block">Fit</span>
                    <span className="font-pill font-bold text-sm text-white">{product.fit}</span>
                  </div>
                </div>
              )}
              {product.fabric && (
                <div className="flex items-center gap-3 p-3.5 bg-[#121212] rounded-2xl border border-white/10 shadow-sm">
                  <Layers className="w-4 h-4 text-white" />
                  <div>
                    <span className="text-[10px] font-label uppercase font-bold text-neutral-400 block">Fabric</span>
                    <span className="font-pill font-bold text-sm text-white">{product.fabric}</span>
                  </div>
                </div>
              )}
              {product.pattern && (
                <div className="flex items-center gap-3 p-3.5 bg-[#121212] rounded-2xl border border-white/10 shadow-sm">
                  <Ruler className="w-4 h-4 text-white" />
                  <div>
                    <span className="text-[10px] font-label uppercase font-bold text-neutral-400 block">Pattern</span>
                    <span className="font-pill font-bold text-sm text-white">{product.pattern}</span>
                  </div>
                </div>
              )}
              {product.sleeve && (
                <div className="flex items-center gap-3 p-3.5 bg-[#121212] rounded-2xl border border-white/10 shadow-sm">
                  <Package className="w-4 h-4 text-white" />
                  <div>
                    <span className="text-[10px] font-label uppercase font-bold text-neutral-400 block">Sleeve</span>
                    <span className="font-pill font-bold text-sm text-white">{product.sleeve}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 shadow-sm">
                <h2 className="text-xs font-heading uppercase tracking-wider text-white mb-2">
                  Product Overview
                </h2>
                <p className="text-xs sm:text-sm font-body text-neutral-300 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Delivery Assurances */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3.5 bg-[#121212] rounded-2xl border border-white/10">
                <Truck className="w-4 h-4 text-neutral-300 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-label uppercase tracking-wider font-bold text-white">Pan-India Express Delivery</span>
                  <p className="text-[11px] font-body text-neutral-400 mt-0.5">Estimated 3–7 business days with complete live tracking.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 bg-[#121212] rounded-2xl border border-white/10">
                <RotateCcw className="w-4 h-4 text-neutral-300 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-label uppercase tracking-wider font-bold text-white">7-Day Easy Returns</span>
                  <p className="text-[11px] font-body text-neutral-400 mt-0.5">Size not matching or transit defect? Hassle-free replacement.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 bg-[#121212] rounded-2xl border border-white/10">
                <Info className="w-4 h-4 text-neutral-300 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-label uppercase tracking-wider font-bold text-white">Best Price Guarantee</span>
                  <p className="text-[11px] font-body text-neutral-400 mt-0.5">Lowest price compared across major marketplaces.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Customer Reviews */}
        {product.reviews.length > 0 && (
          <section className="mt-16 border-t border-white/10 pt-10">
            <h2 className="text-xl font-heading uppercase tracking-wide text-white mb-6">
              Customer Reviews
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.reviews.map((review) => (
                <div key={review.id} className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-label uppercase tracking-wider font-bold text-white">{review.userName}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating ? "fill-amber-400 text-amber-400" : "text-neutral-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.title && (
                    <p className="text-xs font-heading uppercase text-white mb-1">{review.title}</p>
                  )}
                  <p className="text-xs font-body text-neutral-300 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
