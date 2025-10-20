import { StreamCategory } from "@prisma/client";
import { getLiveStreamsGroupedByCategory } from "@/server/services/feed.service";
import CategoryRow from "./category-row";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ThumbnailSkeleton } from "@/components/shared/thumbnail";
import { UserAvatarSkeleton } from "@/components/shared/user-avatar";

const HOMEPAGE_TAKE_PER_ROW = 12;

const CATEGORY_ORDER: { category: StreamCategory; title: string; href: string }[] = [
  { category: StreamCategory.CODING_TECHNOLOGY,   title: "Coding & Technology", href: "/category/CODING_TECHNOLOGY" },
  { category: StreamCategory.CREATIVITY_ARTS,     title: "Creativity & Arts",  href: "/category/CREATIVITY_ARTS" },
  { category: StreamCategory.STUDY_FOCUS,         title: "Study & Focus",      href: "/category/STUDY_FOCUS" },
  { category: StreamCategory.INNOVATION_BUSINESS, title: "Innovation & Business", href: "/category/INNOVATION_BUSINESS" },
];

export const Results = async () => {
  const grouped = await getLiveStreamsGroupedByCategory(
    CATEGORY_ORDER.map((c) => c.category),
    HOMEPAGE_TAKE_PER_ROW
  );

  const allEmpty = CATEGORY_ORDER.every(
    (c) => (grouped.get(c.category) ?? []).length === 0
  );

  return (
    <div className="space-y-12 px-2 md:px-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Live Streams</h1>

      {allEmpty && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <p>No live streams right now.</p>
          <Link
            href="/discover"
            className="text-primary hover:underline font-medium mt-2 inline-block"
          >
            Explore all creators
          </Link>
        </div>
      )}

      {CATEGORY_ORDER.map(({ category, title, href }) => (
        <CategoryRow
          key={category}
          title={title}
          category={category}
          items={grouped.get(category) ?? []}
          showMoreHref={href}
        />
      ))}
    </div>
  );
};


export const ResultCardSkeleton = () => {
  return (
    <div className="h-full w-full space-y-4">
      <ThumbnailSkeleton />
      <div className="flex gap-x-3">
        <UserAvatarSkeleton />
        <div className="flex flex-col gap-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24"/>
        </div>
      </div>
    </div>
  );
};

export const ResultsSkeleton = () => {
  return (
    <div>
      <Skeleton className="h-8 w-[290px] mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {[...Array(4)].map((_, i) => (
          <ResultCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};