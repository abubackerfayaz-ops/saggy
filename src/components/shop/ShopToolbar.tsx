"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useCallback, useTransition, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import SortDropdown from "./SortDropdown";
import ShopFilters from "./ShopFilters";

interface ShopToolbarProps {
  total: number;
}

export default function ShopToolbar({ total }: ShopToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setInputValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(inputValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue, handleSearch]);

  const activeFilterCount = [
    searchParams.get("category"),
    searchParams.get("size"),
    searchParams.get("source"),
    searchParams.get("minPrice"),
    searchParams.get("badge"),
  ].filter(Boolean).length;

  return (
    <>
      <div className="flex items-center gap-3 mb-6 bg-[#121212] border border-white/10 rounded-2xl px-4 py-3 shadow-md">
        {/* Mobile Filters Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 rounded-xl text-white font-cta text-sm tracking-wider uppercase font-bold shrink-0 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4 text-white" />
          <span>FILTERS</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#FF2D88] text-white text-[10px] font-price font-bold flex items-center justify-center shadow-[0_0_8px_rgba(255,45,136,0.6)]">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Search input with debounce */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search shirts, linen, floral, oversized..."
            className="w-full bg-[#181818] hover:bg-[#1E1E1E] focus:bg-[#101010] border border-white/10 focus:border-[#FF2D88] focus:ring-1 focus:ring-[#FF2D88]/40 text-white rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm font-body focus:outline-none transition-all placeholder:text-neutral-500"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {inputValue && (
            <button
              onClick={() => {
                setInputValue("");
                handleSearch("");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Total indicator (desktop) */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-neutral-400 tracking-wider shrink-0 uppercase">
          <span className="font-price font-bold text-white text-sm">{total}</span>
          <span className="font-label">Pieces</span>
        </div>

        {/* Sort Dropdown */}
        <div className="shrink-0 border-l border-white/10 pl-3">
          <SortDropdown />
        </div>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-[#121212] border-l border-white/10 h-full overflow-y-auto p-6 z-10 flex flex-col justify-between shadow-2xl">
            <ShopFilters
              mobileOpen={mobileFiltersOpen}
              onClose={() => setMobileFiltersOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
