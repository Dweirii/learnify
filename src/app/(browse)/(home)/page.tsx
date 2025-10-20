import { Suspense } from "react";

import { Results, ResultsSkeleton } from "@/features/stream/components/home-results";
import { HeroStream, HeroStreamSkeleton } from "@/features/stream/components/hero-stream";

export const revalidate = 30; // Revalidate every 30 seconds for performance

export default function Page() {
  return (
    <div className="h-full p-8 max-w-screen-2xl mx-auto bg-[#141517]">
      <Suspense fallback={<HeroStreamSkeleton />}>
        <HeroStream />
      </Suspense>
      <Suspense fallback={<ResultsSkeleton />}>
        <Results />
      </Suspense>
    </div>
  )
}