"use server";

import { SocialPlatform } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getSelf } from "@/server/services/auth.service";

export const addSocialLink = async (platform: SocialPlatform, url: string) => {
  try {
    const self = await getSelf();

    // Validate URL format based on platform
    if (!isValidSocialUrl(platform, url)) {
      throw new Error(`Invalid ${platform.toLowerCase()} URL format`);
    }

    // Check if user already has a link for this platform
    const existingLink = await db.socialLink.findUnique({
      where: {
        userId_platform: {
          userId: self.id,
          platform: platform
        }
      }
    });

    if (existingLink) {
      throw new Error(`You already have a ${platform.toLowerCase()} link`);
    }

    // Get the next order value
    const lastLink = await db.socialLink.findFirst({
      where: { userId: self.id },
      orderBy: { order: 'desc' }
    });

    const newOrder = lastLink ? lastLink.order + 1 : 0;

    const socialLink = await db.socialLink.create({
      data: {
        userId: self.id,
        platform,
        url,
        order: newOrder
      }
    });

    revalidatePath(`/dashboard/${self.username}/settings`);
    
    return socialLink;
  } catch (error) {
    console.error("Add social link error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to add social link");
  }
};

export const updateSocialLink = async (id: string, url: string) => {
  try {
    const self = await getSelf();

    // Get the existing link to check platform
    const existingLink = await db.socialLink.findFirst({
      where: {
        id,
        userId: self.id
      }
    });

    if (!existingLink) {
      throw new Error("Social link not found");
    }

    // Validate URL format based on platform
    if (!isValidSocialUrl(existingLink.platform, url)) {
      throw new Error(`Invalid ${existingLink.platform.toLowerCase()} URL format`);
    }

    const socialLink = await db.socialLink.update({
      where: { id },
      data: { url }
    });

    revalidatePath(`/dashboard/${self.username}/settings`);
    
    return socialLink;
  } catch (error) {
    console.error("Update social link error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update social link");
  }
};

export const deleteSocialLink = async (id: string) => {
  try {
    const self = await getSelf();

    const socialLink = await db.socialLink.delete({
      where: {
        id,
        userId: self.id
      }
    });

    revalidatePath(`/dashboard/${self.username}/settings`);
    
    return socialLink;
  } catch (error) {
    console.error("Delete social link error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete social link");
  }
};

export const reorderSocialLinks = async (linkIds: string[]) => {
  try {
    const self = await getSelf();

    // Update the order for each link
    const updatePromises = linkIds.map((id, index) => 
      db.socialLink.update({
        where: {
          id,
          userId: self.id
        },
        data: { order: index }
      })
    );

    await Promise.all(updatePromises);

    revalidatePath(`/dashboard/${self.username}/settings`);
    
    return { success: true };
  } catch (error) {
    console.error("Reorder social links error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to reorder social links");
  }
};

// Helper function to validate social media URLs
function isValidSocialUrl(platform: SocialPlatform, url: string): boolean {
  const urlPatterns = {
    GITHUB: /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/?$/,
    YOUTUBE: /^https?:\/\/(www\.)?(youtube\.com\/(channel\/|c\/|user\/|@)?|youtu\.be\/)[\w\-\.]+\/?$/,
    LINKEDIN: /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[\w\-\.]+\/?$/,
    INSTAGRAM: /^https?:\/\/(www\.)?instagram\.com\/[\w\-\.]+\/?$/,
    TWITTER: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[\w\-\.]+\/?$/,
    FACEBOOK: /^https?:\/\/(www\.)?facebook\.com\/[\w\-\.]+\/?$/
  };

  const pattern = urlPatterns[platform];
  return pattern ? pattern.test(url) : false;
}
