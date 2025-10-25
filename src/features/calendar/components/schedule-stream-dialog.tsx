"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { X, Save, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";
import type { ScheduledStream, CreateScheduledStreamData, UpdateScheduledStreamData } from "@/types";
import { StreamCategory } from "@prisma/client";

interface ScheduleStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateScheduledStreamData | UpdateScheduledStreamData) => Promise<{ success: boolean; error?: string }>;
  editingStream?: ScheduledStream | null;
  isLoading?: boolean;
}

const STREAM_CATEGORIES: { value: StreamCategory; label: string }[] = [
  { value: "CODING_TECHNOLOGY", label: "Coding & Technology" },
  { value: "CREATIVITY_ARTS", label: "Creativity & Arts" },
  { value: "STUDY_FOCUS", label: "Study & Focus" },
  { value: "INNOVATION_BUSINESS", label: "Innovation & Business" },
];

// Simple validation schema
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  category: z.enum(["CODING_TECHNOLOGY", "CREATIVITY_ARTS", "STUDY_FOCUS", "INNOVATION_BUSINESS"]),
  startDate: z.string().min(1, "Please select a date"),
  startTime: z.string().min(1, "Please select a time"),
});

type FormData = z.infer<typeof formSchema>;

export const ScheduleStreamDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editingStream,
  isLoading = false
}: ScheduleStreamDialogProps) => {
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editingStream;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "CODING_TECHNOLOGY",
      startDate: format(new Date(), "yyyy-MM-dd"),
      startTime: "19:00",
    }
  });

  // Reset form when dialog opens/closes or editing stream changes
  useEffect(() => {
    if (open) {
      if (editingStream) {
        const startDate = new Date(editingStream.startTime);
        reset({
          title: editingStream.title,
          description: editingStream.description || "",
          category: editingStream.category,
          startDate: format(startDate, "yyyy-MM-dd"),
          startTime: format(startDate, "HH:mm"),
        });
      } else {
        reset({
          title: "",
          description: "",
          category: "CODING_TECHNOLOGY",
          startDate: format(new Date(), "yyyy-MM-dd"),
          startTime: "19:00",
        });
      }
      setError(null);
    }
  }, [open, editingStream, reset]);

  const handleFormSubmit = async (data: FormData) => {
    try {
      setError(null);

      // Combine date and time - all times are in Amman timezone
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      
      // Prepare submission data
      const submitData: CreateScheduledStreamData | UpdateScheduledStreamData = {
        title: data.title,
        description: data.description || undefined,
        category: data.category,
        startTime: startDateTime,
        duration: 120, // Default 2 hours
        isFlexibleDuration: false,
        timezone: "Asia/Amman", // Always Amman timezone
      };

      const result = await onSubmit(submitData);

      if (result.success) {
        onOpenChange(false);
        reset();
      } else {
        setError(result.error || "Failed to save stream");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setError(null);
    }
  };

  const watchedValues = watch();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-[#141517] border-none shadow-[0_0_10px_0_rgba(0,0,0,0.6)] p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">
          {isEditing ? "Edit Stream" : "Schedule Stream"}
        </DialogTitle>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isEditing ? "Edit Stream" : "Schedule Stream"}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {isEditing ? "Update your stream details" : "Create a new scheduled stream"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800/60"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 py-4">
          {/* Error Alert */}
          {error && (
            <Alert className="mb-4 bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Stream Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-white">
                Stream Title *
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="What will you be streaming?"
                className="bg-[#1E1F24] border-gray-700/50 text-white placeholder-gray-500 h-10"
              />
              {errors.title && (
                <p className="text-xs text-red-400">{errors.title.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-white">
                Category *
              </Label>
              <Select
                value={watchedValues.category}
                onValueChange={(value) => setValue("category", value as StreamCategory)}
              >
                <SelectTrigger className="bg-[#1E1F24] border-gray-700/50 text-white h-10">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E1F24] border-gray-700/50">
                  {STREAM_CATEGORIES.map((category) => (
                    <SelectItem
                      key={category.value}
                      value={category.value}
                      className="text-white hover:bg-gray-700 focus:bg-gray-700"
                    >
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-red-400">{errors.category.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-white">
                Description
                <span className="text-xs text-gray-500 font-normal ml-1">(Optional)</span>
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe what you'll be working on..."
                rows={3}
                className="bg-[#1E1F24] border-gray-700/50 text-white placeholder-gray-500 resize-none"
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Help your audience understand what to expect</span>
                <span>{watchedValues.description?.length || 0}/500</span>
              </div>
              {errors.description && (
                <p className="text-xs text-red-400">{errors.description.message}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium text-white">
                  Date *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="bg-[#1E1F24] border-gray-700/50 text-white h-10"
                />
                {errors.startDate && (
                  <p className="text-xs text-red-400">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium text-white">
                  Time *
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register("startTime")}
                  className="bg-[#1E1F24] border-gray-700/50 text-white h-10"
                />
                {errors.startTime && (
                  <p className="text-xs text-red-400">{errors.startTime.message}</p>
                )}
              </div>
            </div>

            {/* Timezone Info */}
            <div className="p-3 bg-[#0FA84E]/10 border border-[#0FA84E]/30 rounded-lg">
              <p className="text-xs text-[#0FA84E]">
                All times are in Amman timezone (GMT+3)
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-700/50">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800/60"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-6 py-2 bg-[#0FA84E] hover:bg-[#0FA84E]/90 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? "Update Stream" : "Schedule Stream"}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};