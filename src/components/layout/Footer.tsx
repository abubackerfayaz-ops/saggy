import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Tag, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-[#AAAAAA] border-t border-[#1E1E1E] font-body">
      {/* ── Trust Pillars Bar (Culture Circle Style) ─────────────────────── */}
      <div className="border-b border-[#1E1E1E] bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-white/5 text-white shrink-0 border border-white/10">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-label font-bold text-white uppercase tracking-wider">100% Legit Check</h4>
                <p className="text-xs font-body text-[#888888] mt-0.5">Physical quality verification before dispatch.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-white/5 text-white shrink-0 border border-white/10">
                <Truck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-label font-bold text-white uppercase tracking-wider">Pan-India Express</h4>
                <p className="text-xs font-body text-[#888888] mt-0.5">Inspected & delivered across 25,000+ pin codes.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-white/5 text-white shrink-0 border border-white/10">
                <RotateCcw className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-label font-bold text-white uppercase tracking-wider">7-Day Easy Returns</h4>
                <p className="text-xs font-body text-[#888888] mt-0.5">Hassle-free size replacement and support.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Footer Directory (Culture Circle Signature Columns) ─────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <div className="flex items-center gap-1.5">
                <span className="font-logo text-3xl sm:text-4xl tracking-wider text-white">
                  SAGGY
                </span>
                <span className="w-2 h-2 rounded-full bg-orange-500 mb-1" />
              </div>
            </Link>
            <p className="text-xs sm:text-sm font-body text-[#888888] leading-relaxed max-w-sm">
              India&apos;s authentic fashion discovery marketplace. Curated, physically inspected garments delivered directly to you.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-label uppercase tracking-wider text-[#AAAAAA]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Curated Sourcing · Physical Inspection</span>
            </div>
          </div>

          {/* Most Viewed (Culture Circle Style) */}
          <div>
            <h4 className="text-xs font-heading uppercase tracking-[2px] text-[#888888] mb-4">
              Most Viewed
            </h4>
            <ul className="space-y-2.5 text-xs font-pill tracking-wide text-[#AAAAAA]">
              <li>
                <Link href="/shop?maxPrice=999" className="hover:text-white transition-colors">
                  Under ₹999
                </Link>
              </li>
              <li>
                <Link href="/shop?minPrice=1000&maxPrice=1499" className="hover:text-white transition-colors">
                  Under ₹1,499
                </Link>
              </li>
              <li>
                <Link href="/shop?badge=best-deals" className="hover:text-white transition-colors">
                  Best Deals
                </Link>
              </li>
              <li>
                <Link href="/shop?sort=popular" className="hover:text-white transition-colors">
                  Trending Grails
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Oversized" className="hover:text-white transition-colors">
                  Oversized Fits
                </Link>
              </li>
            </ul>
          </div>

          {/* Top Categories */}
          <div>
            <h4 className="text-xs font-heading uppercase tracking-[2px] text-[#888888] mb-4">
              Categories
            </h4>
            <ul className="space-y-2.5 text-xs font-pill tracking-wide text-[#AAAAAA]">
              <li>
                <Link href="/shop?category=Casual" className="hover:text-white transition-colors">
                  Casual Shirts
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Formal" className="hover:text-white transition-colors">
                  Formal Shirts
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Linen" className="hover:text-white transition-colors">
                  Pure Linen
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Denim" className="hover:text-white transition-colors">
                  Denim & Twill
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  All 300+ Drops
                </Link>
              </li>
            </ul>
          </div>

          {/* Know More & Contact */}
          <div>
            <h4 className="text-xs font-heading uppercase tracking-[2px] text-[#888888] mb-4">
              Know More
            </h4>
            <ul className="space-y-2.5 text-xs font-pill tracking-wide text-[#AAAAAA]">
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  Authenticity Standard
                </Link>
              </li>

              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <span className="text-[#666666] block pt-2 font-label uppercase tracking-wider">WhatsApp Support:</span>
                <span className="text-white font-price font-bold block tracking-wider">+91 87967 73511</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Newsletter Strip (Culture Circle Style) ──────────────────────── */}
        <div className="mt-12 pt-8 border-t border-[#1E1E1E] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h5 className="text-sm font-heading text-white uppercase tracking-wider">Stay Ahead of Drops</h5>
            <p className="text-xs font-body text-[#888888] mt-0.5">Subscribe for private catalogue restocks and price alerts.</p>
          </div>
          <div className="w-full sm:w-auto flex max-w-md">
            <input
              type="email"
              placeholder="Enter your email address"
              className="bg-[#141414] border border-[#2D2D2D] text-white rounded-l-full px-5 py-3 text-xs font-body focus:outline-none focus:border-white w-full sm:w-64"
            />
            <button
              type="button"
              className="bg-white hover:bg-neutral-200 text-black px-6 py-3 rounded-r-full text-xs font-cta font-bold tracking-widest uppercase transition-colors shrink-0"
            >
              SUBSCRIBE
            </button>
          </div>
        </div>

        {/* ── Bottom Copyright ────────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-[#181818] flex flex-col sm:flex-row items-center justify-between text-xs font-body text-[#666666] gap-3">
          <p>© 2026 SAGGY — Curated Fashion Marketplace. All rights reserved.</p>
          <p className="text-[#555555] font-label uppercase tracking-wider">100% Authentic Products · Verified Lowest Prices</p>
        </div>
      </div>
    </footer>
  );
}
