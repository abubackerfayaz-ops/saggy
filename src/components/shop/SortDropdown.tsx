"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ArrowUpDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest Drops" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
];

export default function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeSort = searchParams.get("sort") ?? "recommended";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="relative flex items-center gap-1.5 font-pill">
      <ArrowUpDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 ${isPending ? "animate-spin" : ""}`} />
      <select
        value={activeSort}
        onChange={handleChange}
        aria-label="Sort products"
        className="text-xs font-semibold uppercase tracking-wider text-neutral-300 bg-transparent border-none outline-none cursor-pointer pr-1 appearance-none hover:text-white transition-colors"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#161616] text-white font-body normal-case">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
