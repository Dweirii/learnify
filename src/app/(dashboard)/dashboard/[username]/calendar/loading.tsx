import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const Loading = () => {
  return (
    <div className="min-h-screen bg-[#141517]">
      <div className="p-6 max-w-screen-2xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Controls Skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="h-8 w-40" />
        </div>

        {/* Calendar Grid Skeleton */}
        <div className="bg-[#141517] rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)] p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-0 mb-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-6" />
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0 border border-gray-700/50 rounded-lg overflow-hidden">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className={cn(
                "min-h-[80px] bg-[#141517] p-2",
                i % 7 !== 6 && "border-r border-gray-700/30",
                i < 28 && "border-b border-gray-700/30"
              )}>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-6" />
                  <div className="space-y-0.5">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
