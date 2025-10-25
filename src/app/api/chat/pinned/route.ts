import { NextRequest, NextResponse } from "next/server";
import { getPinnedMessage, pinMessage, unpinMessage } from "@/server/actions/chat";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/chat/pinned
 * Fetch the currently pinned message for a stream
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get("streamId");

    if (!streamId) {
      return NextResponse.json(
        { error: "streamId is required" },
        { status: 400 }
      );
    }

    const pinnedMessage = await getPinnedMessage(streamId);

    return NextResponse.json({
      pinnedMessage,
      streamId,
    });
  } catch (error) {
    console.error("Error fetching pinned message:", error);
    return NextResponse.json(
      { error: "Failed to fetch pinned message" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/pinned
 * Pin a message for a stream
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { streamId, messageId, messageData } = body;

    if (!streamId || !messageId || !messageData) {
      return NextResponse.json(
        { error: "streamId, messageId, and messageData are required" },
        { status: 400 }
      );
    }

    const result = await pinMessage(streamId, messageId, messageData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to pin message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error pinning message:", error);
    return NextResponse.json(
      { error: "Failed to pin message" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/pinned
 * Unpin a message for a stream
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { streamId } = body;

    if (!streamId) {
      return NextResponse.json(
        { error: "streamId is required" },
        { status: 400 }
      );
    }

    const result = await unpinMessage(streamId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to unpin message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error unpinning message:", error);
    return NextResponse.json(
      { error: "Failed to unpin message" },
      { status: 500 }
    );
  }
}

