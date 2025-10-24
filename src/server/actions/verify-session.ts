"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// Session verification timeout (5 minutes)
const VERIFICATION_TIMEOUT = 5 * 60 * 1000;

export interface SessionVerificationResult {
  requiresReauth: boolean;
  userId: string;
  lastVerified?: Date;
}

export const checkSessionVerification = async (): Promise<SessionVerificationResult> => {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { externalUserId: userId },
      select: { id: true, updatedAt: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Simple implementation: always require confirmation for stream key generation
    // This ensures maximum security for this sensitive operation
    // In production, you might want to implement more sophisticated tracking
    return {
      requiresReauth: true, // Always require confirmation for security
      userId: user.id,
      lastVerified: undefined
    };
  } catch (error) {
    console.error("Session verification error:", error);
    throw new Error("Failed to verify session");
  }
};

export const markSessionAsVerified = async (): Promise<void> => {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Update user's last activity timestamp
    await db.user.update({
      where: { externalUserId: userId },
      data: { updatedAt: new Date() }
    });
  } catch (error) {
    console.error("Failed to mark session as verified:", error);
    throw new Error("Failed to update session verification");
  }
};
