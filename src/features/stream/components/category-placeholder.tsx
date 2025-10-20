import Link from "next/link";
import Image from "next/image";

interface CategoryPlaceholderProps {
  title: string;
  imageUrl: string;
  href: string;
}

export const CategoryPlaceholder = ({ title, imageUrl, href }: CategoryPlaceholderProps) => {
  return (
    <Link href={href}>
      <div className="relative w-full h-[200px] md:h-[280px] rounded-lg overflow-hidden group cursor-pointer">
        {/* Category Image */}
        <Image
          src="/banner.jpg"
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {title}
          </h3>
          <p className="text-sm md:text-base text-gray-200/90">
            No live streams yet
          </p>
          <p className="text-xs md:text-sm text-gray-300/80 mt-2">
            Click to explore this category
          </p>
        </div>
      </div>
    </Link>
  );
};