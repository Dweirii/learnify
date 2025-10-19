"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/store/use-sidebar";
import { BookPlus, HomeIcon, UsersRoundIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
    label: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const ITEMS: Item[] = [
    { label: "Home", href: "/", icon: HomeIcon },
    { label: "Browse", href: "/browse", icon: BookPlus },
    { label: "Following", href: "/following", icon: UsersRoundIcon },
]


export default function SidebarNav() {
  const pathname = usePathname();
  const { collapsed } = useSidebar((state) => state);

  return (
    <nav
      aria-label="Primary"
      className="w-full select-none text-sm text-neutral-200"
    >
      <ul className="space-y-2">
        {ITEMS.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2",
                  "transition-colors duration-150",
                  active
                    ? "bg-white/10 text-white"
                    : "text-neutral-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-white" : "text-neutral-300"
                  )}
                  strokeWidth={2}
                />
                {!collapsed && <span className="font-medium">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* subtle divider, like the screenshot */}
      <div className="mt-4 h-px w-full bg-white/10" />
    </nav>
  );
}