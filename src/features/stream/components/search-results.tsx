import { getSearch } from "@/server/services/search.service";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchStreamResult } from "@/types";

import { StreamCard, StreamCardSkeleton } from "@/features/stream/components/stream-card";

interface ResultsProps {
  term?: string;
};

export const Results = async ({
  term,
}: ResultsProps) => {
  const data = await getSearch(term) as SearchStreamResult[];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Results for term &quot;{term}&quot;
      </h2>
      {data.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No results found. Try searching for something else
        </p>
      )}
      <div className="flex flex-col gap-y-4">
        {data.map((result) => (
          <StreamCard data={result} key={result.id} variant="list" />
        ))}
      </div>
    </div>
  );
};

export const ResultsSkeleton = () => {
  return (
    <div>
      <Skeleton className="h-8 w-[290px] mb-4" />
      <div className="flex flex-col gap-y-4">
        {[...Array(4)].map((_, i) => (
          <StreamCardSkeleton key={i} variant="list" />
        ))}
      </div>
    </div>
  );
};
