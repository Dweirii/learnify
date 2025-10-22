import { Suspense } from "react";

import { Results, ResultsSkeleton } from "@/features/stream/components/home-results";
import { HeroStream, HeroStreamSkeleton } from "@/features/stream/components/hero-stream";
import { getLiveStreamsGroupedByCategory } from "@/server/services/feed.service";
import { StreamCategory } from "@prisma/client";

const CATEGORY_ORDER = [
  StreamCategory.CODING_TECHNOLOGY,
  StreamCategory.CREATIVITY_ARTS,
  StreamCategory.STUDY_FOCUS,
  StreamCategory.INNOVATION_BUSINESS,
];

export default async function Page() {
  const initialStreams = await getLiveStreamsGroupedByCategory(
    CATEGORY_ORDER,
    12
  );

  return (
    <div className="h-full p-8 max-w-screen-2xl mx-auto bg-[#141517]">
      <Suspense fallback={<HeroStreamSkeleton />}>
        <HeroStream />
      </Suspense>
      <Results initialStreams={initialStreams} />
    </div>
  )
}