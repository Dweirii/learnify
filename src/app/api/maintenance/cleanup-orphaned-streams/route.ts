import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Cleanup orphaned ScheduledStream records
 * 
 * This endpoint removes ScheduledStream records that reference non-existent users.
 * This is needed because relationMode = "prisma" doesn't enforce foreign key constraints.
 * 
 * Usage:
 *   POST /api/maintenance/cleanup-orphaned-streams
 *   
 * For safety, this endpoint should be protected in production
 */

export async function POST() {
  try {
    console.log("🔍 Starting cleanup of orphaned ScheduledStream records...");

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
    const orphanedStreamIds: string[] = [];
    const orphanedDetails: Array<{ id: string; title: string; userId: string }> = [];
    
    for (const stream of allStreams) {
      const user = await db.user.findUnique({
        where: { id: stream.userId },
        select: { id: true }
      });

      if (!user) {
        console.log(`❌ Orphaned stream found: ${stream.title} (ID: ${stream.id}, userId: ${stream.userId})`);
        orphanedStreamIds.push(stream.id);
        orphanedDetails.push({
          id: stream.id,
          title: stream.title,
          userId: stream.userId
        });
      }
    }

    if (orphanedStreamIds.length === 0) {
      console.log("✅ No orphaned streams found!");
      return NextResponse.json({
        success: true,
        message: "No orphaned streams found",
        totalStreams: allStreams.length,
        orphanedCount: 0,
        deletedCount: 0,
        orphanedStreams: []
      });
    }

    console.log(`\n🗑️  Found ${orphanedStreamIds.length} orphaned streams. Deleting...`);

    // Delete orphaned streams
    const result = await db.scheduledStream.deleteMany({
      where: {
        id: {
          in: orphanedStreamIds
        }
      }
    });

    console.log(`✅ Successfully deleted ${result.count} orphaned scheduled streams`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} orphaned scheduled streams`,
      totalStreams: allStreams.length,
      orphanedCount: orphanedStreamIds.length,
      deletedCount: result.count,
      orphanedStreams: orphanedDetails
    });

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup orphaned streams",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check for orphaned streams without deleting
export async function GET() {
  try {
    console.log("🔍 Checking for orphaned ScheduledStream records...");

    const allStreams = await db.scheduledStream.findMany({
      select: {
        id: true,
        userId: true,
        title: true,
      }
    });

    const orphanedDetails: Array<{ id: string; title: string; userId: string }> = [];
    
    for (const stream of allStreams) {
      const user = await db.user.findUnique({
        where: { id: stream.userId },
        select: { id: true }
      });

      if (!user) {
        orphanedDetails.push({
          id: stream.id,
          title: stream.title,
          userId: stream.userId
        });
      }
    }

    return NextResponse.json({
      totalStreams: allStreams.length,
      orphanedCount: orphanedDetails.length,
      orphanedStreams: orphanedDetails,
      message: orphanedDetails.length > 0 
        ? `Found ${orphanedDetails.length} orphaned streams. Use POST to delete them.`
        : "No orphaned streams found"
    });

  } catch (error) {
    console.error("❌ Error checking for orphaned streams:", error);
    return NextResponse.json(
      {
        error: "Failed to check for orphaned streams",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

