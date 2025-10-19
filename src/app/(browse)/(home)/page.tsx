import { Suspense } from "react";

import { Results, ResultsSkeleton } from "@/features/stream/components/home-results";

export default function Page() {
  return (
    <div className="h-full p-8 max-w-screen-2xl mx-auto bg-[#161719]">
      <Suspense fallback={<ResultsSkeleton />}>
        <Results />
      </Suspense>
    </div>
  );
};
