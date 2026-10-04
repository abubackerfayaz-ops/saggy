export default function ProductCardSkeleton() {
  return (
    <div className="bg-[#121212] border border-white/10 rounded-2xl p-3 sm:p-3.5 overflow-hidden flex flex-col animate-pulse shadow-md">
      {/* Image skeleton */}
      <div className="aspect-[3/4] bg-[#1C1C1C] rounded-xl" />
      {/* Body skeleton */}
      <div className="pt-3 flex flex-col gap-2.5">
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-[#1C1C1C] rounded" />
          <div className="h-3 w-12 bg-[#1C1C1C] rounded" />
        </div>
        <div className="h-4 w-full bg-[#1C1C1C] rounded" />
        <div className="h-4 w-2/3 bg-[#1C1C1C] rounded" />
        <div className="border-t border-white/10 pt-2 space-y-1.5 mt-2">
          <div className="h-5 w-20 bg-[#1C1C1C] rounded" />
          <div className="h-8 w-full bg-[#1C1C1C] rounded-xl mt-1" />
        </div>
      </div>
    </div>
  );
}
