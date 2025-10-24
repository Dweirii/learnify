"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { 
  Fullscreen,
  Settings,
  Users,
} from "lucide-react";

import { NavItem, NavItemSkeleton } from "./nav-item";

export const Navigation = () => {
  const pathname = usePathname();
  const { user } = useUser();

  const routes = [
    {
      label: "Stream",
      href: `/dashboard/${user?.username}`,
      icon: Fullscreen,
    },
    {
      label: "Settings",
      href: `/dashboard/${user?.username}/settings`,
      icon: Settings,
    },
    {
      label: "Community",
      href: `/dashboard/${user?.username}/community`,
      icon: Users,
    },
  ];

  if (!user?.username) {
    return (
      <nav className="flex-1">
        <ul className="space-y-1">
          {[...Array(3)].map((_, i) => (
            <NavItemSkeleton key={i} />
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav className="flex-1">
      <ul className="space-y-1">
       {routes.map((route) => (
          <NavItem
            key={route.href}
            label={route.label}
            icon={route.icon}
            href={route.href}
            isActive={pathname === route.href}
          />
       ))}
      </ul>
    </nav>
  );
};
