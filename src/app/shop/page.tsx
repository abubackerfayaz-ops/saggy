import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import ProductCard from "@/components/products/ProductCard";
import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";
import ShopFilters from "@/components/shop/ShopFilters";
import Pagination from "@/components/shop/Pagination";
import ShopToolbar from "@/components/shop/ShopToolbar";
import { Package } from "lucide-react";

type SearchParamsType = Promise<{
  q?: string;
  category?: string;
  brand?: string;
  source?: string;
  size?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  badge?: string;
  page?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParamsType;
}): Promise<Metadata> {
  const sp = await searchParams;
  const category = sp.category;
  const q = sp.q;

  let title = "Shop All Shirts | SAGGY — Curated Marketplace";
  if (category) title = `${category} Shirts | SAGGY`;
  if (q) title = `Search: "${q}" Shirts | SAGGY`;

  return {
    title,
    description:
      "Browse curated men's shirts from trusted fashion sources. Best prices with no hidden markups. Casual, Formal, Linen, Oversized shirts.",
  };
}

const LIMIT = 24;

async function getProducts(sp: Awaited<SearchParamsType>) {
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const skip = (page - 1) * LIMIT;
  const q = sp.q ?? "";
  const category = sp.category ?? "";
  const brand = sp.brand ?? "";
  const source = sp.source ?? "";
  const size = sp.size ?? "";
  const minPrice = sp.minPrice ? parseFloat(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? parseFloat(sp.maxPrice) : undefined;
  const sort = sp.sort ?? "recommended";
  const badge = sp.badge ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isActive: true };

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { brand: { contains: q } },
    ];
  }

  if (category) {
    where.category = { name: { equals: category } };
  }

  if (brand) {
    where.brand = { equals: brand };
  }

  if (source) {
    where.source = { equals: source };
  }

  if (size) {
    where.variants = {
      some: {
        size: { equals: size },
        inStock: true,
      },
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.sellingPrice = {};
    if (minPrice !== undefined) where.sellingPrice.gte = minPrice;
    if (maxPrice !== undefined) where.sellingPrice.lte = maxPrice;
  }

  if (badge === "trending") where.isTrending = true;
  if (badge === "best-deals") where.isBestDeal = true;
  if (badge === "featured") where.isFeatured = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { sellingPrice: "asc" };
  else if (sort === "price-desc") orderBy = { sellingPrice: "desc" };
  else if (sort === "popular") orderBy = { reviewCount: "desc" };
  else if (sort === "rating") orderBy = { rating: "desc" };

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
          category: true,
        },
        skip,
        take: LIMIT,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / LIMIT),
      error: false,
    };
  } catch (error) {
    console.error("[Shop] Failed to load products:", error);
    return { products: [], total: 0, page, totalPages: 0, error: true };
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParamsType;
}) {
  const sp = await searchParams;
  const { products, total, page, totalPages, error } = await getProducts(sp);

  const q = sp.q ?? "";
  const category = sp.category ?? "";
  const badge = sp.badge ?? "";

  let heading = "All Drops";
  if (q) heading = `Search: "${q}"`;
  else if (badge === "best-deals") heading = "Best Deals";
  else if (badge === "trending") heading = "Trending Grails";
  else if (badge === "featured") heading = "Featured Drops";
  else if (category) heading = `${category} Collection`;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED]">
      {/* ── Culture Circle Style Shop Banner ─────────────────────────────── */}
      <div className="border-b border-white/10 bg-[#111111] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-pill font-bold text-neutral-400 uppercase tracking-widest mb-1">
                <span>CURATED MARKETPLACE CATALOGUE</span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl text-white uppercase tracking-wide">
                {heading}
              </h1>
            </div>
            <p className="font-body text-xs sm:text-sm text-neutral-400">
              <span className="font-price font-bold text-white text-base mr-1">{total}</span>
              <span className="font-label uppercase tracking-wide text-xs">curated products</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <Suspense fallback={<div className="w-56 xl:w-64 shrink-0" />}>
            <ShopFilters />
          </Suspense>

          {/* Main Product Grid Area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <Suspense fallback={<div className="h-14 bg-[#141414] rounded-2xl mb-6 animate-pulse" />}>
              <ShopToolbar total={total} />
            </Suspense>

            {/* Product Grid */}
            {error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-[#121212] rounded-3xl border border-white/10 p-8 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-[#1C1C1C] flex items-center justify-center mb-4 text-rose-400">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="font-heading text-xl text-white mb-1 uppercase tracking-wide">
                  Catalogue temporarily unavailable
                </h3>
                <p className="font-body text-xs text-neutral-400 max-w-sm mb-5">
                  We couldn&apos;t reach the store right now. Please refresh — your bag is safe.
                </p>
                <Link
                  href="/shop"
                  className="px-6 py-2.5 bg-white text-black font-cta font-bold text-sm tracking-widest uppercase rounded-full hover:bg-neutral-200 transition-colors"
                >
                  Retry
                </Link>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-[#121212] rounded-3xl border border-white/10 p-8 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-[#1C1C1C] flex items-center justify-center mb-4 text-neutral-400">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="font-heading text-xl text-white mb-1 uppercase tracking-wide">No products found</h3>
                <p className="font-body text-xs text-neutral-400 max-w-sm">
                  Try adjusting your search terms or filters. New catalogue items are added daily.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {products.map((product) => (
                    <Suspense key={product.id} fallback={<ProductCardSkeleton />}>
                      <ProductCard product={product} />
                    </Suspense>
                  ))}
                </div>

                {/* Pagination */}
                <Suspense fallback={null}>
                  <Pagination currentPage={page} totalPages={totalPages} />
                </Suspense>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
