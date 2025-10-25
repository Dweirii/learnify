"use client";

import { useState, useEffect } from "react";
import { PublicCalendar } from "@/features/calendar/components";
import { onGetPublicScheduledStreams } from "@/server/actions/scheduled-stream";
import { ScheduledStream } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserScheduleProps {
  username: string;
  className?: string;
}

export const UserSchedule = ({ username, className }: UserScheduleProps) => {
  const [streams, setStreams] = useState<ScheduledStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStreams = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await onGetPublicScheduledStreams(username, 50);
        
        console.log("Public streams result:", result); // Debug log
        
        if (result.success && result.data) {
          console.log("Streams loaded:", result.data.length); // Debug log
          setStreams(result.data);
        } else {
          console.error("Failed to load streams:", result.error); // Debug log
          setError(result.error || "Failed to load schedule");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    loadStreams();
  }, [username]);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 rounded-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert className="bg-red-500/10 border-red-500/30">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <div className="w-8 h-8 text-gray-600">📅</div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Scheduled Streams</h3>
          <p className="text-gray-500">
            {username} hasn&apos;t scheduled any streams yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <PublicCalendar 
        streams={streams} 
        username={username}
      />
    </div>
  );
};
