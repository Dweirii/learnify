"use client";

import { useState, useCallback } from "react";
import { ScheduledStream, CreateScheduledStreamData, UpdateScheduledStreamData } from "@/types";
import { 
  onCreateScheduledStream,
  onUpdateScheduledStream,
  onDeleteScheduledStream,
  onCancelScheduledStream,
  onUncancelScheduledStream
} from "@/server/actions/scheduled-stream";

interface UseScheduleDialogReturn {
  // Dialog state
  isOpen: boolean;
  editingStream: ScheduledStream | null;
  isLoading: boolean;
  error: string | null;

  // Dialog actions
  openCreateDialog: () => void;
  openEditDialog: (stream: ScheduledStream) => void;
  closeDialog: () => void;

  // Form actions
  handleSubmit: (data: CreateScheduledStreamData | UpdateScheduledStreamData) => Promise<{ success: boolean; error?: string }>;
  handleDelete: (stream: ScheduledStream) => Promise<boolean>;
  handleCancel: (stream: ScheduledStream) => Promise<boolean>;
  handleUncancel: (stream: ScheduledStream) => Promise<boolean>;

  // Utility
  clearError: () => void;
}

export const useScheduleDialog = (): UseScheduleDialogReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<ScheduledStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateDialog = useCallback(() => {
    setEditingStream(null);
    setError(null);
    setIsOpen(true);
  }, []);

  const openEditDialog = useCallback((stream: ScheduledStream) => {
    setEditingStream(stream);
    setError(null);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    if (!isLoading) {
      setIsOpen(false);
      setEditingStream(null);
      setError(null);
    }
  }, [isLoading]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleSubmit = useCallback(async (
    data: CreateScheduledStreamData | UpdateScheduledStreamData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      let result;
      if (editingStream) {
        // Update existing stream
        result = await onUpdateScheduledStream(editingStream.id, data as UpdateScheduledStreamData);
      } else {
        // Create new stream
        result = await onCreateScheduledStream(data as CreateScheduledStreamData);
      }

      if (!result.success) {
        setError(result.error || "Failed to save stream");
        return { success: false, error: result.error };
      }

      // Success - dialog will be closed by parent component
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [editingStream]);

  const handleDelete = useCallback(async (stream: ScheduledStream): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await onDeleteScheduledStream(stream.id);
      
      if (!result.success) {
        setError(result.error || "Failed to delete stream");
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCancel = useCallback(async (stream: ScheduledStream): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await onCancelScheduledStream(stream.id);
      
      if (!result.success) {
        setError(result.error || "Failed to cancel stream");
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUncancel = useCallback(async (stream: ScheduledStream): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await onUncancelScheduledStream(stream.id);
      
      if (!result.success) {
        setError(result.error || "Failed to uncancel stream");
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Dialog state
    isOpen,
    editingStream,
    isLoading,
    error,

    // Dialog actions
    openCreateDialog,
    openEditDialog,
    closeDialog,

    // Form actions
    handleSubmit,
    handleDelete,
    handleCancel,
    handleUncancel,

    // Utility
    clearError,
  };
};
