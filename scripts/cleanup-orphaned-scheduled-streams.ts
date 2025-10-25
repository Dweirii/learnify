/**
 * Cleanup script for orphaned ScheduledStream records
 * 
 * This script removes ScheduledStream records that reference non-existent users.
 * This can happen when using relationMode = "prisma" which doesn't enforce
 * foreign key constraints at the database level.
 * 
 * Usage:
 *   npx tsx scripts/cleanup-orphaned-scheduled-streams.ts --yes
 */

import { db } from "@/lib/db";

async function cleanupOrphanedScheduledStreams() {
  console.log("🔍 Checking for orphaned ScheduledStream records...");
  
  try {
    // Find all scheduled streams
    const allStreams = await db.scheduledStream.findMany({
      select: {
        id: true,
        userId: true,
        title: true,
      }
    });

    console.log(`📊 Found ${allStreams.length} total scheduled streams`);

    // Check each stream to see if the user exists
    const orphanedStreams: string[] = [];
    
    for (const stream of allStreams) {
      const user = await db.user.findUnique({
        where: { id: stream.userId },
        select: { id: true }
      });

      if (!user) {
        console.log(`❌ Orphaned stream found: ${stream.title} (ID: ${stream.id}, userId: ${stream.userId})`);
        orphanedStreams.push(stream.id);
      }
    }

    if (orphanedStreams.length === 0) {
      console.log("✅ No orphaned streams found!");
      return 0;
    }

    console.log(`\n🗑️  Found ${orphanedStreams.length} orphaned streams. Deleting...`);

    // Delete orphaned streams
    const result = await db.scheduledStream.deleteMany({
      where: {
        id: {
          in: orphanedStreams
        }
      }
    });

    console.log(`✅ Successfully deleted ${result.count} orphaned scheduled streams`);
    return result.count;

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  }
}

// Run the cleanup
cleanupOrphanedScheduledStreams()
  .then((count) => {
    console.log(`\n✨ Cleanup complete! Removed ${count} orphaned records.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Cleanup failed:", error);
    process.exit(1);
  });

