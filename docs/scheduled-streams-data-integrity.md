# Scheduled Streams Data Integrity Fix

## Issue Summary

**Error**: `Inconsistent query result: Field user is required to return data, got 'null' instead.`

**Location**: `scheduledStream.findMany()` queries in the scheduled stream service

**Root Cause**: Server actions were using Clerk's `user.id` (external user ID) instead of the database user ID when creating scheduled streams, causing records to be created with invalid `userId` references.

## Why This Happens

The server actions in `/src/server/actions/scheduled-stream.ts` were incorrectly using Clerk's authentication response:

1. **Wrong ID Used**: `await currentUser()` returns Clerk's user object where `user.id` is the **external user ID** (from Clerk), not the database user ID
2. **Database Mismatch**: Scheduled streams were created with `userId` set to Clerk's external ID, which doesn't match any `User.id` in the database
3. **Query Failure**: When querying scheduled streams with user relations (`include: { user: {...} }`), Prisma couldn't find matching users
4. **No Validation**: The `relationMode = "prisma"` setting doesn't enforce foreign key constraints at the database level, so invalid records were created without errors

## The Fix

### 1. **Primary Fix: Use Database User ID** ✅

Updated all server actions in `/src/server/actions/scheduled-stream.ts` to use `getSelf()` instead of `currentUser()`:

```typescript
// ❌ Before - Using Clerk's external user ID
import { currentUser } from "@clerk/nextjs/server";

export const onCreateScheduledStream = async (data: CreateScheduledStreamData) => {
  const user = await currentUser(); // Returns Clerk user with external ID
  const stream = await createScheduledStream(user.id, validatedData); // WRONG: user.id is external ID
};

// ✅ After - Using database user ID
import { getSelf } from "@/server/services/auth.service";

export const onCreateScheduledStream = async (data: CreateScheduledStreamData) => {
  const user = await getSelf(); // Returns database user with correct ID
  const stream = await createScheduledStream(user.id, validatedData); // CORRECT: user.id is database ID
};
```

The `getSelf()` function correctly:
1. Gets the Clerk user via `currentUser()`
2. Looks up the database user by `externalUserId`  
3. Returns the database user with the correct `id` field

### 2. Service Layer Resilience

Updated all query functions in `/src/server/services/scheduled-stream.service.ts` to handle any remaining invalid records gracefully:

```typescript
try {
  const streams = await db.scheduledStream.findMany({
    where: { userId },
    include: { user: { select: { ... } } }
  });
  return streams;
} catch (error) {
  console.error("Error fetching streams:", error);
  // Fallback: fetch without user data if relation fails
  const streamsWithoutUser = await db.scheduledStream.findMany({
    where: { userId }
  });
  return streamsWithoutUser;
}
```

### 3. Cleanup Scripts

Created cleanup utilities to identify and remove any invalid records created before the fix:

**Option A: Simple Node.js script** (Recommended)
```bash
node scripts/cleanup-orphaned.mjs
```

**Option B: API Endpoint**
- **Check**: `GET /api/maintenance/cleanup-orphaned-streams`
- **Cleanup**: `POST /api/maintenance/cleanup-orphaned-streams`

**Features:**
- Scans all `ScheduledStream` records
- Checks if the referenced user exists
- Reports invalid records with details
- Deletes invalid records in bulk

## Affected Functions

### Server Actions (Primary Fix)

All server actions in `/src/server/actions/scheduled-stream.ts` were updated to use `getSelf()`:

1. `onCreateScheduledStream()` - Create scheduled stream
2. `onUpdateScheduledStream()` - Update scheduled stream  
3. `onDeleteScheduledStream()` - Delete scheduled stream
4. `onGetScheduledStreams()` - Get filtered streams
5. `onGetUpcomingStreams()` - Get upcoming streams
6. `onGetStreamsForDateRange()` - Get streams in date range
7. `onGetScheduledStreamById()` - Get stream by ID
8. `onCancelScheduledStream()` - Cancel stream
9. `onUncancelScheduledStream()` - Uncancel stream

### Service Layer (Defensive Programming)

The following query functions in `/src/server/services/scheduled-stream.service.ts` have error handling:

1. `getScheduledStreams()` - General query with filters
2. `getUpcomingStreams()` - Fetch upcoming streams for a user
3. `getStreamsForDateRange()` - Fetch streams in a date range

## Type Safety

The `ScheduledStream` type in `/src/types/index.ts` correctly defines `user` as optional:

```typescript
export type ScheduledStream = {
  id: string;
  userId: string;
  user?: SerializedUser; // Optional - may not be included in all queries
  // ... other fields
};
```

This allows queries to work both with and without the user relation included.

## Prevention

To prevent this issue in the future:

1. **Always use Prisma for deletions**: Never delete users directly via SQL
2. **Run periodic cleanup**: Schedule the cleanup script to run periodically
3. **Monitor logs**: Watch for "Error fetching streams" messages which indicate orphaned data
4. **Consider database constraints**: If moving away from `relationMode = "prisma"`, enable actual foreign key constraints at the database level

## Testing

After applying the fix:

1. The application should load the calendar page without errors
2. Streams with valid users will display normally
3. Orphaned streams will be handled gracefully without crashing
4. Error messages will be logged for monitoring

## Migration Path

If you're experiencing this issue in production:

1. **Apply the service fixes** (already done in this PR)
2. **Run the cleanup script** during off-peak hours
3. **Monitor the logs** for any remaining issues
4. **Set up periodic cleanup** as a maintenance task

## Related Files

- `/src/server/actions/scheduled-stream.ts` - **PRIMARY FIX**: Server actions updated to use `getSelf()`
- `/src/server/services/auth.service.ts` - Contains `getSelf()` helper function
- `/src/server/services/scheduled-stream.service.ts` - Service layer with defensive error handling
- `/scripts/cleanup-orphaned.mjs` - Simple cleanup utility script
- `/scripts/cleanup-orphaned-scheduled-streams.ts` - TypeScript cleanup utility
- `/src/app/api/maintenance/cleanup-orphaned-streams/route.ts` - API cleanup endpoint
- `/prisma/schema.prisma` - Database schema with relation definitions
- `/src/types/index.ts` - Type definitions

## Additional Notes

This issue is specific to systems using Prisma's `relationMode = "prisma"`. If you migrate to a database that supports foreign keys (PostgreSQL, MySQL, etc.) and remove this setting, you can enable native foreign key constraints which would prevent orphaned records at the database level.

