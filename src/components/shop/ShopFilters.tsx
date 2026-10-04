"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { X, SlidersHorizontal, Check } from "lucide-react";

const CATEGORIES = [
  "Casual",
  "Formal",
  "Oversized",
  "Linen",
  "Denim",
  "Printed",
  "Party Wear",
  "Office Wear",
];
const SIZES = ["S", "M", "L", "XL", "XXL"];
const SOURCES = ["FADON", "AJIO", "Myntra", "BrandFeed", "MANUAL"];
const PRICE_RANGES = [
  { label: "Under ₹999", maxPrice: "999" },
  { label: "₹1,000 – ₹1,499", minPrice: "1000", maxPrice: "1499" },
  { label: "₹1,500 – ₹1,999", minPrice: "1500", maxPrice: "1999" },
  { label: "₹2,000+", minPrice: "2000" },
];

export default function ShopFilters({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [router, pathname]);

  const activeCategory = searchParams.get("category") ?? "";
  const activeSize = searchParams.get("size") ?? "";
  const activeSource = searchParams.get("source") ?? "";
  const activeMinPrice = searchParams.get("minPrice") ?? "";
  const activeMaxPrice = searchParams.get("maxPrice") ?? "";
  const activeBadge = searchParams.get("badge") ?? "";

  const hasFilters =
    !!activeCategory ||
    !!activeSize ||
    !!activeSource ||
    !!activeMinPrice ||
    !!activeMaxPrice ||
    !!activeBadge;

  const sidebarContent = (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-white" />
          <h2 className="text-xs font-heading uppercase tracking-widest text-white">
            FILTERS
          </h2>
          {isPending && (
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs font-pill uppercase tracking-wider text-neutral-400 font-semibold hover:text-white underline"
            >
              Reset
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Special Badges (Culture Circle Drops) */}
      <div>
        <h3 className="text-[11px] font-heading uppercase tracking-wider text-neutral-400 mb-2.5">
          Curated Drops
        </h3>
        <div className="space-y-1.5">
          {[
            { label: "Under ₹999", value: "under-999" },
            { label: "Best Deals", value: "best-deals" },
            { label: "Trending Grails", value: "trending" },
          ].map(({ label, value }) => {
            const isSelected = activeBadge === value || (value === "under-999" && activeMaxPrice === "999");
            return (
              <button
                key={value}
                onClick={() => {
                  if (value === "under-999") {
                    setParam("maxPrice", activeMaxPrice === "999" ? null : "999");
                  } else {
                    setParam("badge", activeBadge === value ? null : value);
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-pill tracking-wide transition-all ${
                  isSelected
                    ? "bg-white text-black shadow-md font-bold"
                    : "bg-[#181818] border border-white/5 text-neutral-300 hover:bg-[#222222] hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category */}
      <div>
        <h3 className="text-[11px] font-heading uppercase tracking-wider text-neutral-400 mb-2.5">
          Style Category
        </h3>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setParam("category", activeCategory === cat ? null : cat)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-pill tracking-wide transition-all flex items-center justify-between ${
                activeCategory === cat
                  ? "bg-white text-black font-bold"
                  : "text-neutral-300 hover:bg-[#1A1A1A] hover:text-white"
              }`}
            >
              <span>{cat}</span>
              {activeCategory === cat && <Check className="w-3.5 h-3.5 text-black" />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-[11px] font-heading uppercase tracking-wider text-neutral-400 mb-2.5">
          Price Range
        </h3>
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const isSelected =
              activeMinPrice === (range.minPrice ?? "") &&
              activeMaxPrice === (range.maxPrice ?? "");
            return (
              <button
                key={range.label}
                onClick={() => {
                  if (isSelected) {
                    setParam("minPrice", null);
                    setParam("maxPrice", null);
                  } else {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("page");
                    if (range.minPrice) params.set("minPrice", range.minPrice);
                    else params.delete("minPrice");
                    if (range.maxPrice) params.set("maxPrice", range.maxPrice);
                    else params.delete("maxPrice");
                    startTransition(() => {
                      router.push(`${pathname}?${params.toString()}`, { scroll: false });
                    });
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-pill tracking-wide transition-all ${
                  isSelected
                    ? "bg-white text-black font-bold"
                    : "text-neutral-300 hover:bg-[#1A1A1A] hover:text-white"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizes (Culture Circle Pill Grid) */}
      <div>
        <h3 className="text-[11px] font-heading uppercase tracking-wider text-neutral-400 mb-2.5">
          Size
        </h3>
        <div className="grid grid-cols-5 gap-1.5">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setParam("size", activeSize === size ? null : size)}
              className={`py-2 text-xs font-pill font-bold rounded-xl border transition-all text-center ${
                activeSize === size
                  ? "bg-white border-white text-black"
                  : "border-white/10 bg-[#161616] text-neutral-300 hover:border-white/30 hover:text-white"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Sourcing Channel */}
      <div>
        <h3 className="text-[11px] font-heading uppercase tracking-wider text-neutral-400 mb-2.5">
          Channel
        </h3>
        <div className="space-y-1">
          {SOURCES.map((src) => (
            <button
              key={src}
              onClick={() => setParam("source", activeSource === src ? null : src)}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-pill tracking-wide transition-all ${
                activeSource === src
                  ? "bg-white text-black font-bold"
                  : "text-neutral-400 hover:bg-[#1A1A1A] hover:text-white"
              }`}
            >
              {src === "BrandFeed" ? "Brand Partner Feeds" : src}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
      <div className="sticky top-28 bg-[#121212] rounded-2xl p-5 border border-white/10 shadow-xl max-h-[calc(100vh-8rem)] overflow-y-auto">
        {sidebarContent}
      </div>
    </aside>
  );
}
