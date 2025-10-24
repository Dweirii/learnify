import { NextRequest, NextResponse } from "next/server";
import { getSelf } from "@/server/services/auth.service";
import { db } from "@/lib/db";

/**
 * POST /api/upload/thumbnail
 * Simple thumbnail upload using base64 encoding (no external dependencies)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const self = await getSelf();
    if (!self) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    // Validate file size (4MB limit)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 4MB" }, { status: 400 });
    }

    // Convert to base64 for simple storage
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Get current stream
    const currentStream = await db.stream.findUnique({
      where: { userId: self.id },
    });

    if (!currentStream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Update database with base64 data URL
    const updatedStream = await db.stream.update({
      where: { id: currentStream.id },
      data: { thumbnailUrl: dataUrl },
    });

    return NextResponse.json({
      success: true,
      url: dataUrl,
      thumbnailUrl: updatedStream.thumbnailUrl,
    });

  } catch (error) {
    console.error("Thumbnail upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/thumbnail
 * Removes thumbnail from database
 */
export async function DELETE() {
  try {
    // Get authenticated user
    const self = await getSelf();
    if (!self) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current stream
    const currentStream = await db.stream.findUnique({
      where: { userId: self.id },
    });

    if (!currentStream || !currentStream.thumbnailUrl) {
      return NextResponse.json({ error: "No thumbnail to delete" }, { status: 404 });
    }

    // Update database
    const updatedStream = await db.stream.update({
      where: { id: currentStream.id },
      data: { thumbnailUrl: null },
    });

    return NextResponse.json({
      success: true,
      thumbnailUrl: updatedStream.thumbnailUrl,
    });

  } catch (error) {
    console.error("Thumbnail deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
