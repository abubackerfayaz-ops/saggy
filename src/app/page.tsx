import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import ProductCard from "@/components/products/ProductCard";
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Search,
  Flame,
  Layers,
  Award,
} from "lucide-react";


export const revalidate = 60;

async function getHomePageData() {
  try {
    const [featuredShirts, trendingShirts, categories, totalShirtsCount] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
          category: true,
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { isActive: true, isTrending: true },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
          category: true,
        },
        take: 4,
        orderBy: { reviewCount: "desc" },
      }),
      prisma.category.findMany({
        take: 8,
        include: { _count: { select: { products: true } } },
      }),
      prisma.product.count({ where: { isActive: true } }),
    ]);
    return { featuredShirts, trendingShirts, categories, totalShirtsCount };
  } catch (error) {
    console.error("Error loading homepage data:", error);
    return { featuredShirts: [], trendingShirts: [], categories: [], totalShirtsCount: 0 };
  }
}

export default async function HomePage() {
  const { featuredShirts, trendingShirts, categories, totalShirtsCount } = await getHomePageData();

  const quickFilterPills = [
    { label: "Under ₹999", href: "/shop?maxPrice=999" },
    { label: "Best Deals", href: "/shop?badge=best-deals" },
    { label: "Most Viewed", href: "/shop?sort=popular" },
    { label: "Oversized Fits", href: "/shop?category=Oversized" },
    { label: "European Linen", href: "/shop?category=Linen" },
    { label: "Formal Oxfords", href: "/shop?category=Formal" },
    { label: "Casual Cottons", href: "/shop?category=Casual" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A]">

      {/* ── 1. CULTURE CIRCLE HERO BANNER ───────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8 max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden bg-[#111111] border border-white/10 text-white p-8 sm:p-12 lg:p-16 min-h-[380px] sm:min-h-[440px] flex flex-col justify-between shadow-2xl">
          {/* Subtle background glow & texture */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent z-10" />
          <Image
            src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1600&q=80"
            alt="Culture Circle Fashion"
            fill
            priority
            className="object-cover object-center opacity-40 mix-blend-luminosity scale-105"
          />

          {/* Top Pill inside banner */}
          <div className="relative z-20 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-pill font-bold text-white border border-white/20 tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              CURATED MARKETPLACE · {totalShirtsCount}+ STYLES
            </span>
          </div>

          {/* Center / Bottom copy */}
          <div className="relative z-20 max-w-2xl space-y-4 my-auto py-6">
            <h1 className="font-hero text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white uppercase leading-[1.05]">
              THE HOME OF <span className="underline decoration-[#FF2D88] underline-offset-8">CURATED</span> SHIRTS.
            </h1>
            <p className="font-body text-sm sm:text-base text-neutral-300 max-w-xl leading-relaxed">
              Discover curated shirts at the guaranteed lowest price, delivered straight to your door.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/shop"
                className="px-7 py-3 bg-gradient-to-r from-[#FF2D88] to-[#FF5DAA] hover:brightness-110 text-white font-cta font-bold text-lg tracking-widest rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,45,136,0.4)] active:scale-95 uppercase"
              >
                <span>EXPLORE ALL DROPS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shop?badge=best-deals"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-cta text-lg tracking-widest rounded-full border border-white/20 backdrop-blur-md transition-all uppercase"
              >
                VIEW BEST DEALS
              </Link>
            </div>
          </div>

          {/* Bottom stats row inside banner */}
          <div className="relative z-20 pt-6 border-t border-white/15 flex flex-wrap items-center gap-6 sm:gap-12 text-xs font-label text-neutral-300 tracking-wider">
            <div>
              <span className="font-price font-bold text-white text-xl block">{totalShirtsCount}+</span>
              <span>Live Products</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. QUICK DISCOVERY PILLS (Culture Circle Signature) ─────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 w-full">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2">
          {quickFilterPills.map((pill) => (
            <Link
              key={pill.label}
              href={pill.href}
              className="cc-pill cc-pill-inactive shadow-sm"
            >
              <span>{pill.label}</span>
            </Link>
          ))}
        </div>
      </section>


      {/* ── 4. TRENDING / MOST POPULAR DROPS ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-pill font-bold text-[#FF2D88] uppercase tracking-widest">
              <Flame className="w-3.5 h-3.5 text-[#FF2D88]" />
              <span>HIGH DEMAND</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl text-white tracking-tight mt-1 uppercase">
              Trending Right Now
            </h2>
          </div>
          <Link
            href="/shop?badge=trending"
            className="text-xs font-pill font-bold text-neutral-400 hover:text-white flex items-center gap-1 tracking-widest uppercase transition-colors"
          >
            <span>VIEW ALL</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {featuredShirts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ── 5. SHOP BY BUDGET ─────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6">
          <span className="text-xs font-pill font-bold text-neutral-400 uppercase tracking-widest">
            PRICE TIERS
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl text-white tracking-tight mt-1 uppercase">
            Shop by Price
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              href: "/shop?maxPrice=999",
              tag: "VALUE PICK",
              title: "UNDER ₹999",
              desc: "Everyday essentials, cotton solids & casual wear.",
              accent: "border-white/10 hover:border-white/30 bg-[#121212]",
            },
            {
              href: "/shop?minPrice=1000&maxPrice=1499",
              tag: "MOST POPULAR",
              title: "₹1,000 – ₹1,499",
              desc: "Drop-shoulder oversized, washed twills & oxfords.",
              accent: "border-white/10 hover:border-white/30 bg-[#121212]",
            },
            {
              href: "/shop?minPrice=1500",
              tag: "PREMIUM GRAILS",
              title: "₹1,500+",
              desc: "100% pure European linen & luxury satin weaves.",
              accent: "border-white/10 hover:border-white/30 bg-[#121212]",
            },
            {
              href: "/shop?badge=best-deals",
              tag: "BEST VALUE",
              title: "MAX SAVINGS",
              desc: "Highest catalog discount on our curated selection.",
              accent: "border-[#FF2D88]/40 bg-[#FF2D88]/10 hover:border-[#FF2D88] shadow-[0_0_20px_rgba(255,45,136,0.15)]",
            },
          ].map((tier) => (
            <Link
              key={tier.title}
              href={tier.href}
              className={`rounded-2xl p-6 border ${tier.accent} transition-all shadow-md group flex flex-col justify-between`}
            >
              <div>
                <span className="text-[10px] font-pill font-bold tracking-widest text-neutral-400 uppercase">
                  {tier.tag}
                </span>
                <h3 className="font-heading text-3xl text-white mt-1 group-hover:underline uppercase">
                  {tier.title}
                </h3>
                <p className="font-body text-xs text-neutral-400 mt-2 leading-relaxed">
                  {tier.desc}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-sm font-cta font-bold text-white group-hover:translate-x-1 transition-transform tracking-widest uppercase">
                <span>Shop Tier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 6. CURATED CATEGORIES ───────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-pill font-bold text-neutral-400 uppercase tracking-widest">
              CATEGORIES
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl text-white tracking-tight mt-1 uppercase">
              Curated Styles
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-pill font-bold text-neutral-400 hover:text-white flex items-center gap-1 tracking-widest uppercase transition-colors"
          >
            <span>ALL STYLES</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${encodeURIComponent(cat.name)}`}
              className="bg-[#121212] rounded-2xl p-5 border border-white/10 hover:border-white/30 transition-all shadow-md group"
            >
              <span className="text-[10px] font-label font-bold text-neutral-400 uppercase tracking-widest block">
                {cat._count.products} PIECES
              </span>
              <h3 className="font-product text-base sm:text-lg font-bold text-white group-hover:text-[#FF2D88] transition-colors mt-1">
                {cat.name}
              </h3>
              <p className="font-body text-xs text-neutral-400 mt-1 line-clamp-1">
                {cat.description || "Curated shirts"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 7. ALL FEATURED DROPS ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-pill font-bold text-neutral-400 uppercase tracking-widest">
              FRESH CATALOGUE
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl text-white tracking-tight mt-1 uppercase">
              Latest Additions
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-pill font-bold text-neutral-400 hover:text-white flex items-center gap-1 tracking-widest uppercase transition-colors"
          >
            <span>EXPLORE ALL ({totalShirtsCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {featuredShirts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2.5 px-8 py-3 bg-white hover:bg-neutral-200 text-black font-cta font-bold text-xl tracking-widest rounded-full transition-all shadow-xl active:scale-95 uppercase"
          >
            <span>BROWSE ALL {totalShirtsCount} PIECES</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>


    </div>
  );
}
