import { StreamCategory } from "@prisma/client";
import { getLiveStreamsGroupedByCategory } from "@/server/services/feed.service";
import CategoryRow from "./category-row";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbnailSkeleton } from "@/components/shared/thumbnail";
import { UserAvatarSkeleton } from "@/components/shared/user-avatar";

const HOMEPAGE_TAKE_PER_ROW = 12;

const CATEGORY_ORDER: { 
  category: StreamCategory; 
  title: string; 
  href: string;
  imageUrl: string;
}[] = [
  { 
    category: StreamCategory.CODING_TECHNOLOGY, 
    title: "Coding & Technology", 
    href: "/category/CODING_TECHNOLOGY",
    imageUrl: "/categories/coding-technology.jpg"
  },
  { 
    category: StreamCategory.CREATIVITY_ARTS, 
    title: "Creativity & Arts", 
    href: "/category/CREATIVITY_ARTS",
    imageUrl: "/categories/creativity-arts.jpg"
  },
  { 
    category: StreamCategory.STUDY_FOCUS, 
    title: "Study & Focus", 
    href: "/category/STUDY_FOCUS",
    imageUrl: "/categories/study-focus.jpg"
  },
  { 
    category: StreamCategory.INNOVATION_BUSINESS, 
    title: "Innovation & Business", 
    href: "/category/INNOVATION_BUSINESS",
    imageUrl: "/categories/innovation-business.jpg"
  },
];

export const Results = async () => {
  const grouped = await getLiveStreamsGroupedByCategory(
    CATEGORY_ORDER.map((c) => c.category),
    HOMEPAGE_TAKE_PER_ROW
  );

  // Sort categories: categories with streams first (by stream count desc), then empty ones
  const sortedCategories = [...CATEGORY_ORDER].sort((a, b) => {
    const aStreams = grouped.get(a.category)?.length ?? 0;
    const bStreams = grouped.get(b.category)?.length ?? 0;
    
    // If both have streams, sort by count (descending)
    if (aStreams > 0 && bStreams > 0) {
      return bStreams - aStreams;
    }
    
    // Categories with streams come first
    if (aStreams > 0 && bStreams === 0) return -1;
    if (aStreams === 0 && bStreams > 0) return 1;
    
    // Both empty, maintain original order
    return 0;
  });

  return (
    <div className="space-y-12 px-2 md:px-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Live Streams</h1>

      {sortedCategories.map(({ category, title, href, imageUrl }) => (
        <CategoryRow
          key={category}
          title={title}
          category={category}
          items={grouped.get(category) ?? []}
          showMoreHref={href}
          categoryImageUrl={imageUrl}
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