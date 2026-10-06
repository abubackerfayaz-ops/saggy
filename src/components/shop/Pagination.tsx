"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: true });
    });
  };

  const getPages = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <nav aria-label="Product pagination" className="flex items-center justify-center gap-1.5 py-12 font-pill">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1 || isPending}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#161616] border border-white/10 text-neutral-300 hover:text-white hover:border-white/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPages().map((page, idx) =>
        page === "..." ? (
          <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-neutral-500 text-xs font-price">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page as number)}
            disabled={isPending}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-price font-bold transition-all shadow-sm ${
              page === currentPage
                ? "bg-gradient-to-r from-[#FF2D88] to-[#FF5DAA] text-white shadow-[0_0_12px_rgba(255,45,136,0.4)] border border-[#FF5DAA]/50"
                : "bg-[#161616] border border-white/10 text-neutral-300 hover:text-white hover:border-[#FF2D88]/40"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages || isPending}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#161616] border border-white/10 text-neutral-300 hover:text-white hover:border-white/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
