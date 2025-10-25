import { db } from "@/lib/db";
import { toZonedTime, fromZonedTime, format } from "date-fns-tz";
import { 
  ScheduledStream, 
  CreateScheduledStreamData, 
  UpdateScheduledStreamData, 
  ScheduledStreamFilters,
} from "@/types";

// Re-export types for use in actions
export type { 
  CreateScheduledStreamData, 
  UpdateScheduledStreamData, 
  ScheduledStreamFilters 
} from "@/types";

// Timezone utilities
export const convertToTimezone = (date: Date, timezone: string): Date => {
  try {
    return toZonedTime(date, timezone);
  } catch (error) {
    console.warn(`Invalid timezone ${timezone}, using UTC:`, error);
    return date;
  }
};

export const convertFromTimezone = (date: Date, timezone: string): Date => {
  try {
    return fromZonedTime(date, timezone);
  } catch (error) {
    console.warn(`Invalid timezone ${timezone}, using UTC:`, error);
    return date;
  }
};

export const formatInTimezone = (date: Date, timezone: string, formatString: string = "yyyy-MM-dd HH:mm"): string => {
  try {
    return format(convertToTimezone(date, timezone), formatString);
  } catch (error) {
    console.warn(`Error formatting date in timezone ${timezone}:`, error);
    return format(date, formatString);
  }
};

// Database operations
export const createScheduledStream = async (
  userId: string,
  data: CreateScheduledStreamData
): Promise<ScheduledStream> => {
  // Convert start time to UTC if timezone is provided
  const startTime = data.timezone && data.timezone !== 'UTC' 
    ? convertFromTimezone(data.startTime, data.timezone)
    : data.startTime;

  // Note: Removed the constraint that limited users to one scheduled stream
  // Users can now have multiple scheduled streams

  const stream = await db.scheduledStream.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      category: data.category,
      startTime,
      duration: data.duration,
      isFlexibleDuration: data.isFlexibleDuration || false,
      timezone: data.timezone || 'UTC',
      isCancelled: false,
    },
  });

  return stream as ScheduledStream;
};

export const updateScheduledStream = async (
  id: string,
  userId: string,
  data: UpdateScheduledStreamData
): Promise<ScheduledStream> => {
  // Convert start time to UTC if timezone is provided
  const updateData: UpdateScheduledStreamData = { ...data };
  if (data.startTime && data.timezone && data.timezone !== 'UTC') {
    updateData.startTime = convertFromTimezone(data.startTime, data.timezone);
  }

  const stream = await db.scheduledStream.update({
    where: { 
      id,
      userId // Ensure user can only update their own streams
    },
    data: updateData,
  });

  return stream as ScheduledStream;
};

export const deleteScheduledStream = async (
  id: string,
  userId: string
): Promise<ScheduledStream> => {
  const stream = await db.scheduledStream.delete({
    where: { 
      id,
      userId // Ensure user can only delete their own streams
    },
  });

  return stream as ScheduledStream;
};

export const getScheduledStreams = async (
  filters: ScheduledStreamFilters
): Promise<ScheduledStream[]> => {
  console.log("getScheduledStreams called with filters:", filters); // Debug log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }
  
  if (filters.category) {
    where.category = filters.category;
  }
  
  if (filters.startDate || filters.endDate) {
    where.startTime = {};
    if (filters.startDate) {
      where.startTime.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.startTime.lte = filters.endDate;
    }
  }
  
  if (typeof filters.isCancelled === 'boolean') {
    where.isCancelled = filters.isCancelled;
  }

  console.log("Database query where clause:", where); // Debug log
  
  try {
    const streams = await db.scheduledStream.findMany({
      where,
      orderBy: { startTime: 'asc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
            externalUserId: true,
          }
        }
      }
    });
    console.log("Database returned streams:", streams.length); // Debug log
    return streams as ScheduledStream[];
  } catch (error) {
    console.error("Error fetching scheduled streams:", error);
    // Fallback without user data
    const streamsWithoutUser = await db.scheduledStream.findMany({
      where,
      orderBy: { startTime: 'asc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });
    
    console.log("Database returned streams (without user):", streamsWithoutUser.length);
    return streamsWithoutUser as ScheduledStream[];
  }
};

export const getUpcomingStreams = async (userId: string, limit: number = 10): Promise<ScheduledStream[]> => {
  const now = new Date();
  
  try {
    const streams = await db.scheduledStream.findMany({
      where: {
        userId,
        startTime: { gt: now },
        isCancelled: false,
      },
      orderBy: { startTime: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
            externalUserId: true,
          }
        }
      }
    });

    return streams as ScheduledStream[];
  } catch (error) {
    console.error("Error fetching upcoming streams:", error);
    // Fallback without user data
    const streamsWithoutUser = await db.scheduledStream.findMany({
      where: {
        userId,
        startTime: { gt: now },
        isCancelled: false,
      },
      orderBy: { startTime: 'asc' },
      take: limit,
    });
    
    return streamsWithoutUser as ScheduledStream[];
  }
};

export const getStreamsForDateRange = async (
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<ScheduledStream[]> => {
  try {
    const streams = await db.scheduledStream.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        isCancelled: false,
      },
      orderBy: { startTime: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
            externalUserId: true,
          }
        }
      }
    });

    return streams as ScheduledStream[];
  } catch (error) {
    console.error("Error fetching streams for date range:", error);
    // If the error is due to missing user relations, fetch without user data
    const streamsWithoutUser = await db.scheduledStream.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        isCancelled: false,
      },
      orderBy: { startTime: 'asc' },
    });
    
    return streamsWithoutUser as ScheduledStream[];
  }
};

export const getScheduledStreamById = async (
  id: string,
  userId?: string
): Promise<ScheduledStream | null> => {
  const where: { id: string; userId?: string } = { id }; // Changed type
  if (userId) {
    where.userId = userId;
  }
  const stream = await db.scheduledStream.findUnique({
    where,
  });
  return stream as ScheduledStream | null;
};

// Auto-cleanup expired streams
export const cleanupExpiredStreams = async (): Promise<number> => {
  const now = new Date();
  
  const result = await db.scheduledStream.deleteMany({
    where: {
      startTime: {
        lt: now
      }
    }
  });
  
  console.log(`Cleaned up ${result.count} expired streams`);
  return result.count;
};

// Public calendar page queries
export const getAllPublicUpcomingStreams = async (limit: number = 50): Promise<ScheduledStream[]> => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  try {
    const streams = await db.scheduledStream.findMany({
      where: {
        startTime: { gte: startOfToday },
        isCancelled: false,
      },
      orderBy: { startTime: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
            externalUserId: true,
          }
        }
      }
    });

    return streams as ScheduledStream[];
  } catch (error) {
    console.error("Error fetching all public upcoming streams:", error);
    return [];
  }
};

export const getFollowingScheduledStreams = async (userId: string, limit: number = 50): Promise<ScheduledStream[]> => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  try {
    // Get streams from users that the current user follows
    const streams = await db.scheduledStream.findMany({
      where: {
        startTime: { gte: startOfToday },
        isCancelled: false,
        user: {
          followedBy: {
            some: {
              followerId: userId,
            }
          }
        }
      },
      orderBy: { startTime: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
            externalUserId: true,
          }
        }
      }
    });

    return streams as ScheduledStream[];
  } catch (error) {
    console.error("Error fetching following scheduled streams:", error);
    return [];
  }
};

export const getRecommendedScheduledStreams = async (userId: string, limit: number = 50): Promise<ScheduledStream[]> => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  try {
    // Get streams from users that the current user is NOT following and who haven't blocked them
    const streams = await db.scheduledStream.findMany({
      where: {
        startTime: { gte: startOfToday },
        isCancelled: false,
        userId: { not: userId }, // Not their own streams
        user: {
          AND: [
            {
              // Not already following
              NOT: {
                followedBy: {
                  some: {
                    followerId: userId,
                  }
                }
              }
            },
            {
              // User hasn't blocked current user
              NOT: {
                blocking: {
                  some: {
                    blockedId: userId,
                  }
                }
              }
            }
          ]
        }
      },
      orderBy: { startTime: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
            externalUserId: true,
          }
        }
      }
    });

    return streams as ScheduledStream[];
  } catch (error) {
    console.error("Error fetching recommended scheduled streams:", error);
    return [];
  }
};

// Utility functions for UI
export const getStreamDurationText = (duration: number, isFlexible: boolean): string => {
  if (isFlexible) {
    return `${Math.floor(duration / 60)}h+`;
  }
  
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

export const getRecurrenceText = (): string => {
  // Since we removed recurrence, just return a simple text
  return "One-time stream";
};