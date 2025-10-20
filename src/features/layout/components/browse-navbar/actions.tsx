"use client";

import { useUser } from "@clerk/nextjs";
import { SignOutButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
  LogOut,
  ChevronDown,
  LayoutDashboard,
  User,
  Settings,
  Bell,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Actions = () => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-16 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <SignInButton mode="modal">
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            Sign In
          </Button>
        </SignInButton>
      </div>
    );
  }

  const userInitials =
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
    user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ||
    "U";

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-3 ml-2 px-2 py-1 h-auto hover:bg-muted/50 transition-all duration-200 data-[state=open]:bg-muted/50 rounded-lg focus-visible:outline-none focus-visible:ring-0 focus:outline-none focus:ring-0"
          >
            <div className="relative">
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={user.imageUrl || "/placeholder.svg"}
                  alt={user.firstName || "User"}
                />
                <AvatarFallback className="bg-muted text-foreground font-medium text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-col items-start text-left min-w-0 hidden sm:hidden lg:flex">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {user.firstName ||
                    user.emailAddresses[0]?.emailAddress.split("@")[0]}
                </span>
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {user.emailAddresses[0]?.emailAddress}
              </span>
            </div>

            <ChevronDown className="h-4 w-4 text-muted-foreground ml-1 transition-transform data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 p-2 bg-[#141517]" sideOffset={8}>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-3 px-3 py-4 bg-muted/30 rounded-lg mb-2">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-background">
                  <AvatarImage
                    src={user.imageUrl || "/placeholder.svg"}
                    alt={user.firstName || "User"}
                  />
                  <AvatarFallback className="bg-muted text-foreground font-medium text-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm truncate">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName ||
                        user.emailAddresses[0]?.emailAddress.split("@")[0]}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {user.emailAddresses[0]?.emailAddress}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuItem asChild className="cursor-pointer focus:bg-muted/50 rounded-md">
            <Link href="/profile" className="flex items-center gap-3 px-2 py-2.5">
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-md">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Profile</span>
                <span className="text-xs text-muted-foreground">Update your information</span>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer focus:bg-muted/50 rounded-md">
            <Link
              href={`/dashboard/${user.username || user.id}`}
              className="flex items-center gap-3 px-2 py-2.5"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-md">
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Dashboard</span>
                <span className="text-xs text-muted-foreground">Streamer Hub</span>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer focus:bg-muted/50 rounded-md">
            <Link href="/settings" className="flex items-center gap-3 px-2 py-2.5">
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-md">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Settings</span>
                <span className="text-xs text-muted-foreground">Configure your preferences</span>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer focus:bg-muted/50 rounded-md">
            <Link href="/notifications" className="flex items-center gap-3 px-2 py-2.5">
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-md relative">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-3 w-3 p-0 text-xs flex items-center justify-center"
                >
                  3
                </Badge>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Notifications</span>
                <span className="text-xs text-muted-foreground">View your alerts</span>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer focus:bg-muted/50 rounded-md">
            <Link href="/help" className="flex items-center gap-3 px-2 py-2.5">
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-md">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Help & Support</span>
                <span className="text-xs text-muted-foreground">Get assistance</span>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem asChild className="cursor-pointer focus:bg-destructive/10 rounded-md">
            <SignOutButton>
              <button className="flex items-center gap-3 px-2 py-2.5 w-full text-left hover:bg-destructive/10 focus:bg-destructive/10 transition-colors">
                <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-md">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-s text-left">Sign Out</span>
                  <span className="text-xs text-muted-foreground">End your session</span>
                </div>
              </button>
            </SignOutButton>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
