import Link from "next/link";
import type { HomeStreamResult } from "@/types";
import type { StreamCategory } from "@prisma/client";
import { StreamCard } from "@/features/stream/components/stream-card";
import { CategoryPlaceholder } from "@/features/stream/components/category-placeholder";

type CategoryRowProps = {
  title: string;
  category: StreamCategory;
  items: HomeStreamResult[];
  showMoreHref: string;
  categoryImageUrl: string;
};

export default function CategoryRow({ 
  title, 
  category, 
  items, 
  showMoreHref,
  categoryImageUrl 
}: CategoryRowProps) {
  // Show placeholder if no streams
  if (!items || items.length === 0) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <CategoryPlaceholder 
          title={title}
          imageUrl={categoryImageUrl}
          href={showMoreHref}
        />
      </section>
    );
  }

  // Show live streams if available
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link
          href={showMoreHref}
          className="text-sm text-muted-foreground hover:text-primary transition"
        >
          Show More
        </Link>
      </div>

      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] pb-2">
        <div className="flex gap-3 pr-2 md:pr-0">
          {items.map((item) => (
            <div key={item.id} className="min-w-[260px] max-w-[280px]">
              <StreamCard data={item} variant="grid" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}