"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ScheduledStream, CreateScheduledStreamData, UpdateScheduledStreamData } from "@/types";
import { CalendarView } from "./calendar-view";
import { ScheduleStreamDialog } from "./schedule-stream-dialog";
import { DeleteStreamDialog } from "./delete-stream-dialog";
import { useScheduleDialog } from "../hooks/use-schedule-dialog";
import { onGetStreamsForDateRange, onCleanupExpiredStreams } from "@/server/actions/scheduled-stream";

interface CalendarManagerProps {
  className?: string;
}

export const CalendarManager = ({ className }: CalendarManagerProps) => {
  const [streams, setStreams] = useState<ScheduledStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    isOpen: isScheduleDialogOpen,
    editingStream,
    isLoading: isDialogLoading,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    handleSubmit,
    handleDelete,
  } = useScheduleDialog();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [streamToDelete, setStreamToDelete] = useState<ScheduledStream | null>(null);

  // Load streams for current month
  const loadStreams = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);

      // Clean up expired streams first
      const cleanupResult = await onCleanupExpiredStreams();
      if (cleanupResult.success && cleanupResult.count && cleanupResult.count > 0) {
        console.log(`Cleaned up ${cleanupResult.count} expired streams`);
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // Load 3 months ahead

      const result = await onGetStreamsForDateRange(startDate, endDate);
      
      if (result.success && result.data) {
        setStreams(result.data);
      } else {
        setError(result.error || "Failed to load streams");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load streams on mount
  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  const handleCreateStream = () => {
    openCreateDialog();
  };

  const handleEditStream = (stream: ScheduledStream) => {
    openEditDialog(stream);
  };

  const handleDeleteStream = async (stream: ScheduledStream) => {
    const result = await handleDelete(stream);
    if (result) {
      // Reload streams after successful deletion
      await loadStreams();
    }
  };

  const handleStreamSubmit = useCallback(async (data: CreateScheduledStreamData | UpdateScheduledStreamData) => {
    const result = await handleSubmit(data);
    if (result.success) {
      // Reload streams after successful creation/update
      await loadStreams(true);
    }
    return result;
  }, [handleSubmit, loadStreams]);

  const handleDateClick = () => {
    // For now, just open create dialog with pre-filled date
    // In the future, could show a date-specific view
    openCreateDialog();
  };

  const handleStreamClick = (stream: ScheduledStream) => {
    // Could open a quick preview or edit dialog
    openEditDialog(stream);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-700 rounded animate-pulse" />
        </div>
        <Alert className="bg-red-900/20 border-red-500/30">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {error}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={() => loadStreams()} className="bg-[#0FA84E] hover:bg-[#0FA84E]/90">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 max-w-screen-2xl mx-auto", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white">My Scheduled Stream</h1>
        <Button
          onClick={handleCreateStream}
          className="bg-[#0FA84E] hover:bg-[#0FA84E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {streams.length > 0 ? "Edit Stream" : "Schedule Stream"}
        </Button>
      </div>

      {/* Main Content */}
      {streams.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Stream Scheduled</h3>
          <p className="text-gray-500 mb-6">Schedule your first stream to get started</p>
          <Button
            onClick={handleCreateStream}
            className="bg-[#0FA84E] hover:bg-[#0FA84E]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Your Stream
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Current Stream Hero Section */}
          <div className="bg-[#141517] rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)] p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-[#0FA84E] rounded-full animate-pulse"></div>
                  <h2 className="text-xl font-bold text-white">Next Stream</h2>
                </div>
                
                {streams.map((stream) => (
                  <div key={stream.id} className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{stream.title}</h3>
                      {stream.description && (
                        <p className="text-gray-300 text-lg leading-relaxed">{stream.description}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm text-gray-400">Scheduled for</p>
                          <p className="text-white font-semibold">
                            {new Date(stream.startTime).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm text-gray-400">Time</p>
                          <p className="text-white font-semibold">
                            {new Date(stream.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Asia/Amman'
                            })} (Amman)
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm text-gray-400">Duration</p>
                          <p className="text-white font-semibold">{Math.floor(stream.duration / 60)}h {stream.duration % 60}m</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          stream.category === 'CODING_TECHNOLOGY' ? 'bg-blue-500/20 text-blue-300' :
                          stream.category === 'CREATIVITY_ARTS' ? 'bg-purple-500/20 text-purple-300' :
                          stream.category === 'STUDY_FOCUS' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {stream.category === 'CODING_TECHNOLOGY' ? 'Coding & Tech' :
                           stream.category === 'CREATIVITY_ARTS' ? 'Creative & Arts' :
                           stream.category === 'STUDY_FOCUS' ? 'Study & Focus' :
                           'Business & Innovation'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => streams[0] && handleEditStream(streams[0])}
                  variant="outline"
                  className="border-none bg-[#1E1F24] text-gray-300 hover:text-white hover:bg-[#0FA84E]"
                >
                  Edit Stream
                </Button>
                <Button
                  onClick={() => {
                    if (streams[0]) {
                      setStreamToDelete(streams[0]);
                      setDeleteDialogOpen(true);
                    }
                  }}
                  variant="outline"
                  className="border-none bg-[#1E1F24] text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  Cancel Stream
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Calendar View</h3>
              <p className="text-sm text-gray-400">See your stream in context</p>
            </div>
            <CalendarView
              streams={streams}
              onDateClick={handleDateClick}
              onStreamClick={handleStreamClick}
            />
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ScheduleStreamDialog
        open={isScheduleDialogOpen}
        onOpenChange={closeDialog}
        onSubmit={handleStreamSubmit}
        editingStream={editingStream}
        isLoading={isDialogLoading}
      />
      <DeleteStreamDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        stream={streamToDelete}
        onConfirm={async () => {
          if (streamToDelete) {
            await handleDeleteStream(streamToDelete);
          }
        }}
        isLoading={isDialogLoading}
      />
    </div>
  );
};