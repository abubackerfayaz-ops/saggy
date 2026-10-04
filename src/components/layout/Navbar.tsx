"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Heart, Search, Menu, X, ShieldCheck, Flame, SlidersHorizontal } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const categoryPills = [
    { label: "All Drops", href: "/shop", isHot: false },
    { label: "Under ₹999", href: "/shop?maxPrice=999", isHot: true },
    { label: "Best Deals", href: "/shop?badge=best-deals", isHot: false },
    { label: "Casual", href: "/shop?category=Casual", isHot: false },
    { label: "Formal", href: "/shop?category=Formal", isHot: false },
    { label: "Oversized Fits", href: "/shop?category=Oversized", isHot: false },
    { label: "Pure Linen", href: "/shop?category=Linen", isHot: false },
    { label: "Denim & Twill", href: "/shop?category=Denim", isHot: false },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 transition-all">
      {/* ── Top Bar: Logo, Search, Actions ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo - Culture Circle Style Bold Modern Wordmark */}
          <Link href="/" className="flex flex-col group shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-logo text-3xl sm:text-4xl tracking-wider text-white group-hover:opacity-80 transition-opacity leading-none">
                SAGGY
              </span>
              <span className="w-2 h-2 rounded-full bg-orange-500 mb-1" />
            </div>
            <span className="text-[9px] uppercase font-pill font-bold tracking-[0.25em] text-neutral-400 -mt-0.5 hidden sm:block">
              CURATED FASHION CIRCLE
            </span>
          </Link>

          {/* Central Search Bar (Culture Circle Signature Pill Search) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-6">
            <form action="/shop" method="GET" className="relative w-full">
              <input
                type="text"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 300+ authentic shirts, oversized, linen, brands..."
                className="w-full bg-[#161616] hover:bg-[#1E1E1E] focus:bg-[#111111] border border-white/10 focus:border-white text-white rounded-full pl-11 pr-12 py-3 text-xs sm:text-sm font-body transition-all placeholder:text-neutral-500 outline-none"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </form>
          </div>

          {/* Right Action Icons (Culture Circle Style) */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Wishlist */}
            <Link
              href="/shop"
              className="p-2.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart Bag */}
            <Link
              href="/shop"
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-200 text-black rounded-full transition-all active:scale-95 shadow-sm"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-cta text-sm font-bold tracking-widest hidden sm:inline uppercase">BAG</span>
              <span className="w-4 h-4 rounded-full bg-black text-white text-[10px] font-price font-black flex items-center justify-center -ml-0.5">
                0
              </span>
            </Link>
          </div>

        </div>

        {/* ── Sub Bar: Horizontal Category Pills (Culture Circle Style) ────── */}
        <div className="py-2.5 overflow-x-auto no-scrollbar border-t border-white/10 flex items-center gap-2">
          {categoryPills.map((pill) => (
            <Link
              key={pill.label}
              href={pill.href}
              className={`cc-pill shrink-0 font-pill tracking-wide text-xs sm:text-sm ${
                pill.isHot
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "cc-pill-inactive"
              }`}
            >
              <span>{pill.label}</span>
            </Link>
          ))}
          <Link
            href="/shop"
            className="text-xs font-cta uppercase tracking-widest font-bold text-neutral-400 hover:text-white ml-auto shrink-0 pl-3 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter All</span>
          </Link>
        </div>
      </div>

      {/* ── Mobile Menu Dropdown ─────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#121212] border-b border-white/10 px-4 py-5 space-y-4 shadow-2xl">
          {/* Mobile Search */}
          <form action="/shop" method="GET" className="relative w-full">
            <input
              type="text"
              name="q"
              placeholder="Search 300+ curated shirts..."
              className="w-full bg-[#181818] border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm font-body text-white placeholder:text-neutral-500 focus:outline-none focus:border-white"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          {/* Links */}
          <div className="space-y-1 pt-2">
            {categoryPills.map((pill) => (
              <Link
                key={pill.label}
                href={pill.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-pill uppercase tracking-wider font-semibold text-neutral-200 hover:bg-white/10"
              >
                {pill.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-label uppercase tracking-wider text-neutral-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Verified Legit Sourcing
            </span>
          </div>

        </div>
      )}
    </header>
  );
}
