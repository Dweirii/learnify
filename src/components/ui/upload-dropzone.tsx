"use client";

import React, { useState, useRef, useCallback, DragEvent } from "react";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { validateThumbnailFile } from "@/lib/bunny-cdn";

interface UploadDropzoneProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  currentThumbnailUrl?: string | null;
  disabled?: boolean;
  className?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  preview: string | null;
}

export function UploadDropzone({
  onUploadComplete,
  onUploadError,
  currentThumbnailUrl,
  disabled = false,
  className,
}: UploadDropzoneProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    preview: null,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled) return;

    // Reset state
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      preview: null,
    });

    try {
      // Validate file
      const validation = validateThumbnailFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || "Invalid file");
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setUploadState(prev => ({ ...prev, preview: previewUrl }));

      // Upload via API route instead of direct Bunny CDN
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      if (result.success && result.url) {
        setUploadState(prev => ({ ...prev, isUploading: false, progress: 100 }));
        onUploadComplete(result.url);
        
        // Clean up preview URL
        URL.revokeObjectURL(previewUrl);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        preview: null,
      });
      onUploadError?.(errorMessage);
    }
  }, [disabled, onUploadComplete, onUploadError]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  }, [disabled, handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle click to select file
  const handleClick = useCallback(() => {
    if (!disabled && !uploadState.isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploadState.isUploading]);

  // Reset upload state
  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      preview: null,
    });
  }, []);

  return (
    <div className={cn("w-full", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer group",
          "hover:border-[#0BA84E]/60 hover:bg-gradient-to-br hover:from-[#0BA84E]/5 hover:to-transparent",
          "hover:shadow-lg hover:shadow-[#0BA84E]/10",
          isDragOver && "border-[#0BA84E] bg-gradient-to-br from-[#0BA84E]/15 to-[#0BA84E]/5 scale-[1.02]",
          disabled && "opacity-50 cursor-not-allowed",
          uploadState.isUploading && "pointer-events-none",
          uploadState.error && "border-red-500 bg-gradient-to-br from-red-500/10 to-red-500/5"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="p-8 text-center">
          {/* Upload Icon */}
          <div className={cn(
            "mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
            "bg-gradient-to-br from-gray-800 to-gray-900 group-hover:from-[#0BA84E]/20 group-hover:to-[#0BA84E]/10",
            "shadow-lg group-hover:shadow-[#0BA84E]/20",
            isDragOver && "bg-gradient-to-br from-[#0BA84E]/30 to-[#0BA84E]/20 scale-110",
            uploadState.error && "bg-gradient-to-br from-red-500/20 to-red-500/10"
          )}>
            {uploadState.error ? (
              <AlertCircle className="w-7 h-7 text-red-500" />
            ) : uploadState.isUploading ? (
              <div className="w-7 h-7 border-3 border-[#0BA84E] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-7 h-7 text-gray-400 group-hover:text-[#0BA84E] transition-colors duration-300" />
            )}
          </div>

          {/* Upload Text */}
          <div className="space-y-3">
            <h3 className={cn(
              "text-xl font-bold transition-colors",
              uploadState.error ? "text-red-500" : "text-white"
            )}>
              {uploadState.error 
                ? "Upload Failed" 
                : uploadState.isUploading 
                ? "Uploading..." 
                : isDragOver 
                ? "Drop your thumbnail here" 
                : "Upload Thumbnail"
              }
            </h3>
            
            <p className="text-sm text-gray-400 leading-relaxed">
              {uploadState.error 
                ? uploadState.error
                : uploadState.isUploading 
                ? "Please wait while we process your image..."
                : "Click to select or drag & drop an image"
              }
            </p>

            {/* File Requirements */}
            {!uploadState.isUploading && !uploadState.error && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full text-xs text-gray-400 border border-gray-700">
                <div className="w-1.5 h-1.5 bg-[#0BA84E] rounded-full"></div>
                <span>Supports: JPEG, PNG, WebP • Max: 4MB</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {uploadState.isUploading && (
            <div className="mt-6">
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#0BA84E] to-[#0BA84E]/80 h-3 rounded-full transition-all duration-500 ease-out shadow-lg shadow-[#0BA84E]/30"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-400">
                  Uploading your thumbnail...
                </p>
                <p className="text-sm font-medium text-[#0BA84E]">
                  {Math.round(uploadState.progress)}%
                </p>
              </div>
            </div>
          )}

          {/* Error Actions */}
          {uploadState.error && (
            <div className="mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  resetUploadState();
                }}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Preview Overlay */}
        {uploadState.preview && (
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <Image
              src={uploadState.preview}
              alt="Preview"
              fill
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-10 h-10 border-3 border-[#0BA84E] border-t-transparent rounded-full animate-spin mx-auto mb-3 shadow-lg shadow-[#0BA84E]/30" />
                <p className="text-sm font-medium">Processing your image...</p>
                <p className="text-xs text-gray-300 mt-1">This may take a moment</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Thumbnail Display */}
      {currentThumbnailUrl && !uploadState.isUploading && !uploadState.error && (
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded-xl border border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 shadow-lg">
              <Image
                src={currentThumbnailUrl}
                alt="Current thumbnail"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Current Thumbnail</p>
              <p className="text-xs text-gray-400 mt-1">Click above to upload a new one</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#0BA84E]" />
              <span className="text-xs text-[#0BA84E] font-medium">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Optimization Tips */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800/30 rounded-full text-xs text-gray-400 border border-gray-700/50">
          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
          <span className="sm:hidden">📱 Tap to select from your gallery</span>
          <span className="hidden sm:block">💡 Drag & drop or click to upload</span>
        </div>
      </div>
    </div>
  );
}
