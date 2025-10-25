"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScheduledStream } from "@/types";

interface DeleteStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stream: ScheduledStream | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export const DeleteStreamDialog = ({
  open,
  onOpenChange,
  stream,
  onConfirm,
  isLoading = false
}: DeleteStreamDialogProps) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  if (!stream) return null;

  const streamDate = new Date(stream.startTime).toLocaleDateString();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-[#141517] border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            Delete Scheduled Stream
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stream Info */}
          <div className="p-4 bg-[#1a1b1e] rounded-lg border border-gray-700">
            <h3 className="font-semibold text-white mb-2">{stream.title}</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <p>Date: {streamDate}</p>
              <p>Duration: {Math.floor(stream.duration / 60)}h {stream.duration % 60}m</p>
              <p>Type: One-time</p>
            </div>
          </div>

          {/* Warning */}
          <Alert className="bg-red-900/20 border-red-500/30">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              This will permanently delete this scheduled stream.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isLoading ? "Deleting..." : "Delete Stream"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
