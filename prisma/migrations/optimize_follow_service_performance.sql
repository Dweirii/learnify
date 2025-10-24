-- Migration: Optimize Follow Service Database Performance
-- This migration adds critical indexes for the optimized follow service queries

-- Add composite index for the main getFollowedUsers query
-- This covers: followerId + followingId + blocking check + stream data
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_follow_follower_stream_live" 
ON "Follow" ("followerId", "createdAt" DESC) 
INCLUDE ("followingId");

-- Add index for efficient blocking checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_block_blocker_blocked" 
ON "Block" ("blockerId", "blockedId");

-- Add index for reverse blocking checks (when checking if user is blocked)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_block_blocked_blocker" 
ON "Block" ("blockedId", "blockerId");

-- Add partial index for live streams only (saves space and improves performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_stream_live_only" 
ON "Stream" ("userId", "viewerCount" DESC, "updatedAt" DESC) 
WHERE "isLive" = true;

-- Add index for follow statistics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_follow_stats_follower" 
ON "Follow" ("followerId") 
WHERE "followerId" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_follow_stats_following" 
ON "Follow" ("followingId") 
WHERE "followingId" IS NOT NULL;

-- Add covering index for user lookups with essential fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_covering" 
ON "User" ("id") 
INCLUDE ("username", "imageUrl", "bio", "createdAt", "updatedAt", "externalUserId");

-- Add index for batch operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_follow_batch_lookup" 
ON "Follow" ("followerId", "followingId", "createdAt");

-- Add index for efficient EXISTS queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_follow_exists_check" 
ON "Follow" ("followerId", "followingId") 
WHERE "followerId" IS NOT NULL AND "followingId" IS NOT NULL;

-- Add index for stream-user relationship optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_stream_user_relationship" 
ON "Stream" ("userId", "isLive", "viewerCount", "updatedAt");

-- Add index for user blocking optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_blocking_optimization" 
ON "User" ("id") 
WHERE "id" IS NOT NULL;

-- Add statistics for query planner optimization
ANALYZE "Follow";
ANALYZE "Block";
ANALYZE "Stream";
ANALYZE "User";

-- Add comments for documentation
COMMENT ON INDEX "idx_follow_follower_stream_live" IS 'Optimizes getFollowedUsers query with followerId and createdAt ordering';
COMMENT ON INDEX "idx_block_blocker_blocked" IS 'Optimizes blocking checks in follow queries';
COMMENT ON INDEX "idx_stream_live_only" IS 'Partial index for live streams only, improves performance and saves space';
COMMENT ON INDEX "idx_follow_exists_check" IS 'Optimizes EXISTS queries for follow status checks';
COMMENT ON INDEX "idx_user_covering" IS 'Covering index for user lookups with essential fields included';
