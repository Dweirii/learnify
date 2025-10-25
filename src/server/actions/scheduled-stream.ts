"use server";

import { revalidatePath } from "next/cache";
import { getSelf } from "@/server/services/auth.service";
import { getUserByUsername } from "@/server/services/user.service";
import { 
  createScheduledStream,
  updateScheduledStream,
  deleteScheduledStream,
  getScheduledStreams,
  getUpcomingStreams,
  getStreamsForDateRange,
  getScheduledStreamById,
  cleanupExpiredStreams,
  CreateScheduledStreamData, 
  UpdateScheduledStreamData, 
  ScheduledStreamFilters 
} from "@/server/services/scheduled-stream.service";
import { 
  createScheduledStreamSchema,
  updateScheduledStreamSchema,
  scheduledStreamFiltersSchema,
  validateBody
} from "@/lib/validations";

/**
 * Server Actions for Scheduled Streams
 * Handles all CRUD operations with proper validation and error handling
 */

export const onCreateScheduledStream = async (data: CreateScheduledStreamData) => {
  try {
    // Get authenticated database user
    const user = await getSelf();

    // Validate input data
    const validatedData = validateBody(createScheduledStreamSchema, data);

    // Create the scheduled stream using database user ID
    const stream = await createScheduledStream(user.id, validatedData);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/${user.username}/calendar`);

    return { success: true, data: stream };
  } catch (error) {
    console.error("Create scheduled stream error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create scheduled stream" 
    };
  }
};

export const onUpdateScheduledStream = async (
  id: string, 
  data: UpdateScheduledStreamData
) => {
  try {
    // Get authenticated database user
    const user = await getSelf();

    // Validate input data
    const validatedData = validateBody(updateScheduledStreamSchema, data);

    // Update the scheduled stream using database user ID
    const stream = await updateScheduledStream(id, user.id, validatedData);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/${user.username}/calendar`);

    return { success: true, data: stream };
  } catch (error) {
    console.error("Update scheduled stream error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update scheduled stream" 
    };
  }
};

export const onDeleteScheduledStream = async (id: string) => {
  try {
    // Get authenticated database user
    const user = await getSelf();

    // Delete the scheduled stream using database user ID
    await deleteScheduledStream(id, user.id);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/${user.username}/calendar`);

    return { success: true };
  } catch (error) {
    console.error("Delete scheduled stream error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete scheduled stream" 
    };
  }
};

export const onGetScheduledStreams = async (filters: ScheduledStreamFilters) => {
  try {
    // Get authenticated database user
    const user = await getSelf();

    // Validate filters
    const validatedFilters = validateBody(scheduledStreamFiltersSchema, filters);

    // Ensure user can only access their own streams unless specified otherwise
    const userFilters = {
      ...validatedFilters,
      userId: validatedFilters.userId || user.id,
    };

    // Get scheduled streams using database user ID
    const streams = await getScheduledStreams(userFilters);

    return { success: true, data: streams };
  } catch (error) {
    console.error("Get scheduled streams error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get scheduled streams" 
    };
  }
};

export const onGetUpcomingStreams = async (limit: number = 10) => {
  try {
    // Get authenticated database user
    const user = await getSelf();

    // Get upcoming streams
    const streams = await getUpcomingStreams(user.id, limit);

    return { success: true, data: streams };
  } catch (error) {
    console.error("Get upcoming streams error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get upcoming streams" 
    };
  }
};

export const onGetStreamsForDateRange = async (
  startDate: Date,
  endDate: Date
) => {
  try {
    // Get authenticated database user
    const user = await getSelf();

    // Get streams for date range
    const streams = await getStreamsForDateRange(user.id, startDate, endDate);

    return { success: true, data: streams };
  } catch (error) {
    console.error("Get streams for date range error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get streams for date range" 
    };
  }
};

export const onGetScheduledStreamById = async (id: string) => {
  try {
    // Get authenticated database user
    const user = await getSelf();

    // Get scheduled stream by ID
    const stream = await getScheduledStreamById(id, user.id);

    if (!stream) {
      throw new Error("Scheduled stream not found");
    }

    return { success: true, data: stream };
  } catch (error) {
    console.error("Get scheduled stream by ID error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get scheduled stream" 
    };
  }
};

// Utility actions
export const onCancelScheduledStream = async (id: string) => {
  try {
    // Get authenticated database user
    const user = await getSelf();

    // Cancel the scheduled stream
    const stream = await updateScheduledStream(id, user.id, { isCancelled: true });

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/${user.username}/calendar`);

    return { success: true, data: stream };
  } catch (error) {
    console.error("Cancel scheduled stream error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to cancel scheduled stream" 
    };
  }
};

export const onUncancelScheduledStream = async (id: string) => {
  try {
    // Get authenticated database user
    const user = await getSelf();

    // Uncancel the scheduled stream
    const stream = await updateScheduledStream(id, user.id, { isCancelled: false });

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/${user.username}/calendar`);

    return { success: true, data: stream };
  } catch (error) {
    console.error("Uncancel scheduled stream error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to uncancel scheduled stream" 
    };
  }
};

// Public Actions (for viewers)
export const onGetPublicScheduledStreams = async (username: string, limit?: number) => {
  try {
    console.log("Fetching public streams for username:", username); // Debug log
    
    const user = await getUserByUsername(username);
    if (!user) {
      console.log("User not found:", username); // Debug log
      return { success: false, error: "User not found" };
    }

    console.log("User found:", user.id); // Debug log

    const filters: ScheduledStreamFilters = {
      userId: user.id,
      isCancelled: false,
      limit: limit || 20,
    };

    console.log("Filters:", filters); // Debug log

    const streams = await getScheduledStreams(filters);
    console.log("Streams found:", streams.length); // Debug log
    
    return { success: true, data: streams };
  } catch (error) {
    console.error("Error fetching public scheduled streams:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch streams" 
    };
  }
};

// Cleanup Action
export const onCleanupExpiredStreams = async () => {
  try {
    const count = await cleanupExpiredStreams();
    return { success: true, count };
  } catch (error) {
    console.error("Error cleaning up expired streams:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to cleanup streams" 
    };
  }
};
