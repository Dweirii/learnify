// Shared TypeScript types for the application
// This file will be expanded when integrating tRPC

import { StreamCategory } from "@prisma/client";

// Social platform types
export type SocialPlatform = "GITHUB" | "YOUTUBE" | "LINKEDIN" | "INSTAGRAM" | "TWITTER" | "FACEBOOK";

// Scheduled Stream types
export type RecurrencePattern = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export type ScheduledStream = {
  id: string;
  userId: string;
  user?: SerializedUser; // Optional user field for when it's included in queries
  title: string;
  description: string | null;
  category: StreamCategory;
  startTime: Date;
  duration: number; // in minutes
  isFlexibleDuration: boolean;
  timezone: string;
  isCancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ScheduledStreamWithOccurrences = ScheduledStream & {
  occurrences?: Date[]; // Generated for display
};

export type CreateScheduledStreamData = {
  title: string;
  description?: string;
  category: StreamCategory;
  startTime: Date;
  duration: number;
  isFlexibleDuration?: boolean;
  timezone?: string;
};

export type UpdateScheduledStreamData = Partial<CreateScheduledStreamData> & {
  isCancelled?: boolean;
};

export type ScheduledStreamFilters = {
  userId?: string;
  category?: StreamCategory;
  startDate?: Date;
  endDate?: Date;
  isRecurring?: boolean;
  isCancelled?: boolean;
  limit?: number;
  offset?: number;
};

export type SocialLink = {
  id: string;
  platform: SocialPlatform | string; // Allow string for backward compatibility
  url: string;
  order: number;
};

export type SerializedUser = {
  id: string;
  username: string;
  imageUrl: string;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
  externalUserId: string;
  socialLinks?: SocialLink[];
};

export type SerializedStream = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  isLive: boolean;
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  ingressId: string | null;
  serverUrl: string | null;
  streamKey: string | null;
};

// For home page results
export type HomeStreamResult = {
  id: string;
  user: SerializedUser;
  isLive: boolean;
  name: string;
  thumbnailUrl: string | null;
  category: StreamCategory;
};

// For search page results
export type SearchStreamResult = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  isLive: boolean;
  updatedAt: Date;
  user: SerializedUser;
};

export type SerializedUserWithStream = {
  id: string;
  username: string;
  imageUrl: string;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
  externalUserId: string;
  stream: { 
    isLive: boolean;
    viewerCount: number;
    id: string;
  } | null;
};

export type SerializedFollow = {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
  updatedAt: Date;
  following: SerializedUserWithStream;
};

export type HeroStreamResult = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  isLive: boolean;
  category: StreamCategory;
  viewerCount: number;
  user: SerializedUser;
}

// Future types will be added here for:
// - API response types
// - Shared interfaces
// - tRPC router types
// - Database model extensions
