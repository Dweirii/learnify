// Shared TypeScript types for the application
// This file will be expanded when integrating tRPC

import { StreamCategory } from "@prisma/client";

export type SerializedUser = {
  id: string;
  username: string;
  imageUrl: string;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
  externalUserId: string;
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
