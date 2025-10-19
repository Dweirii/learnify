import { Skeleton } from "@/components/ui/skeleton";

export const NavbarSkeleton = () => {
  return (
    <nav className="fixed top-0 left-0 w-full h-20 z-[49] px-2 lg:px-4 flex justify-between items-center shadow-sm bg-white dark:bg-[#141517]">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24 rounded" />
      </div>
      <div className="flex items-center gap-2 w-full lg:w-[400px]">
        <Skeleton className="h-10 w-full rounded" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-16 rounded" />
      </div>
    </nav>
  );
};
  