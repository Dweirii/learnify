import { notFound } from "next/navigation";
import { StreamCategory } from "@prisma/client";
import { getLiveStreamsByCategory } from "@/server/services/feed.service";
import { StreamCard } from "@/features/stream/components/stream-card";
import Link from "next/link";

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams?: Promise<{ page?: string }>;
};

const PAGE_SIZE = 24;

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const { page = "1" } = (await searchParams) ?? {};
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);

  if (!Object.values(StreamCategory).includes(category as StreamCategory)) {
    notFound();
  }

  const items = await getLiveStreamsByCategory(category as StreamCategory, {
    take: PAGE_SIZE,
    page: pageNum,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {formatTitle(category as StreamCategory)}
        </h1>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition">
          Back to Home
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-muted-foreground text-sm">No live streams right now.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {items.map((it) => (
            <StreamCard key={it.id} data={it as any} variant="grid" />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <PaginationLink
          href={`/category/${category}?page=${Math.max(pageNum - 1, 1)}`}
          disabled={pageNum <= 1}
        >
          Previous
        </PaginationLink>
        <PaginationLink
          href={`/category/${category}?page=${pageNum + 1}`}
          disabled={items.length < PAGE_SIZE}
        >
          Next
        </PaginationLink>
      </div>
    </div>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="text-muted-foreground text-sm">{children}</span>;
  }
  return (
    <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition">
      {children}
    </Link>
  );
}

function formatTitle(category: StreamCategory) {
  switch (category) {
    case "CODING_TECHNOLOGY":
      return "Coding & Technology";
    case "CREATIVITY_ARTS":
      return "Creativity & Arts";
    case "STUDY_FOCUS":
      return "Study & Focus";
    case "INNOVATION_BUSINESS":
      return "Innovation & Business";
    default:
      return category;
  }
}