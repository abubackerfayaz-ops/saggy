import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <div className="bg-[#000000] text-white text-[11px] font-dm py-2 px-4 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto font-medium">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-neutral-200 text-[10px] font-bold tracking-wider uppercase">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            100% VERIFIED AUTHENTIC
          </span>
          <span className="hidden md:inline text-neutral-300">
            Authenticated fashion catalogue · <span className="text-white font-bold underline decoration-orange-500 underline-offset-4">Verified Lowest Prices</span>
          </span>
          <span className="md:hidden text-neutral-300">
            Verified Lowest Prices · Always
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-neutral-400 text-[11px]">
          <span>Pan-India Delivery</span>
          <span className="w-1 h-1 bg-neutral-600 rounded-full" />
          <Link
            href="/shop"
            className="hover:text-white transition-colors inline-flex items-center gap-1 font-semibold text-neutral-200"
          >
            Explore Drops <ArrowRight className="w-3 h-3 text-orange-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
