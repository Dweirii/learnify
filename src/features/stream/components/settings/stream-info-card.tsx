"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStream } from "@/server/actions/stream";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import { StreamCategory } from "@prisma/client";
import { Monitor, Palette, BookOpen, Lightbulb, Trash, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface StreamInfoCardProps {
  initialName: string;
  initialCategory: StreamCategory;
  initialThumbnailUrl: string | null;
}

const categories = [
  {
    value: StreamCategory.CODING_TECHNOLOGY,
    label: "Coding & Technology",
    icon: Monitor,
    color: "bg-transparent",
    description: "Programming, software development, and tech tutorials"
  },
  {
    value: StreamCategory.CREATIVITY_ARTS,
    label: "Creativity & Arts",
    icon: Palette,
    color: "bg-transparent",
    description: "Digital art, design, music, and creative content"
  },
  {
    value: StreamCategory.STUDY_FOCUS,
    label: "Study & Focus",
    icon: BookOpen,
    color: "bg-transparent",
    description: "Educational content, tutorials, and learning sessions"
  },
  {
    value: StreamCategory.INNOVATION_BUSINESS,
    label: "Innovation & Business",
    icon: Lightbulb,
    color: "bg-transparent",
    description: "Entrepreneurship, business strategies, and innovation"
  }
];

export function StreamInfoCard({ 
  initialName, 
  initialCategory, 
  initialThumbnailUrl 
}: StreamInfoCardProps) {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState(initialCategory);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnailUrl);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(value !== initialName || category !== initialCategory || thumbnailUrl !== initialThumbnailUrl);
  };

  const handleCategoryChange = (newCategory: StreamCategory) => {
    setCategory(newCategory);
    setHasChanges(name !== initialName || newCategory !== initialCategory || thumbnailUrl !== initialThumbnailUrl);
  };

  const handleThumbnailUpload = (url: string) => {
    setThumbnailUrl(url);
    setHasChanges(name !== initialName || category !== initialCategory || url !== initialThumbnailUrl);
  };

  const handleThumbnailRemove = () => {
    setThumbnailUrl(null);
    setHasChanges(name !== initialName || category !== initialCategory || initialThumbnailUrl !== null);
  };

  // Update thumbnail stats when image loads
  useEffect(() => {
    if (thumbnailUrl) {
      const img = document.createElement('img');
      img.onload = () => {
        const dimensions = `${img.naturalWidth}x${img.naturalHeight}`;
        const aspectRatio = (img.naturalWidth / img.naturalHeight).toFixed(2);
        
        const dimensionsEl = document.getElementById('thumbnail-dimensions');
        const aspectRatioEl = document.getElementById('thumbnail-aspect-ratio');
        
        if (dimensionsEl) dimensionsEl.textContent = dimensions;
        if (aspectRatioEl) aspectRatioEl.textContent = aspectRatio;
      };
      img.src = thumbnailUrl;
    }
  }, [thumbnailUrl]);

  const handleSave = () => {
    if (name.length < 3) {
      toast.error("Stream name must be at least 3 characters", {
        description: "Please enter a longer name for your stream"
      });
      return;
    }

    if (name.length > 100) {
      toast.error("Stream name is too long", {
        description: "Please keep your stream name under 100 characters"
      });
      return;
    }

    if (!name.trim()) {
      toast.error("Stream name cannot be empty", {
        description: "Please enter a valid stream name"
      });
      return;
    }

    startTransition(() => {
      updateStream({ 
        name: name.trim(), 
        category,
        thumbnailUrl 
      })
        .then(() => {
          toast.success("Stream settings updated successfully", {
            description: "Your changes have been saved and will be visible to viewers"
          });
          setHasChanges(false);
        })
        .catch((error) => {
          console.error("Update error:", error);
          toast.error("Failed to update stream settings", {
            description: error.message || "Please try again or contact support if the issue persists"
          });
        });
    });
  };

  return (
    <Card className="bg-transparent  shadow-[0_0_10px_0_rgba(0,0,0,0.6)] border-none">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-white">
          <div>
            <h2 className="text-xl font-bold">Stream Information</h2>
            <p className="text-sm text-gray-400 font-normal">Configure your stream details and appearance</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stream Name */}
        <div className="space-y-3">
          <Label htmlFor="stream-name" className="text-white font-semibold">
            Stream Name
          </Label>
          <div className="relative">
            <Input
              id="stream-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your stream name..."
              className={cn(
                "bg-transparent border-gray-600 text-white placeholder-gray-400 transition-all duration-200",
                "focus:border-[#08A84F] focus:ring-[#08A84F]/20",
                name.length < 3 && name.length > 0 && "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500/20",
                name.length >= 3 && "border-green-500/50 focus:border-green-500 focus:ring-green-500/20"
              )}
              maxLength={100}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className={cn(
                "w-8 h-6 rounded flex items-center justify-center transition-colors duration-200",
                name.length < 3 && name.length > 0 ? "bg-yellow-500/20" : 
                name.length >= 3 ? "bg-green-500/20" : "bg-gray-700/50"
              )}>
                <span className={cn(
                  "text-xs font-medium transition-colors duration-200",
                  name.length < 3 && name.length > 0 ? "text-yellow-400" : 
                  name.length >= 3 ? "text-green-400" : "text-gray-400"
                )}>
                  {name.length}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400">
                Choose a name that represents your content
              </p>
              {name.length < 3 && name.length > 0 && (
                <span className="text-xs text-yellow-400 font-medium">
                  • Too short
                </span>
              )}
              {name.length >= 3 && (
                <span className="text-xs text-green-400 font-medium">
                  • Good length
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {name.length}/100 characters
            </p>
          </div>
        </div>

        {/* Stream Category */}
        <div className="space-y-4">
          <div>
            <Label className="text-white font-semibold">Stream Category</Label>
            <p className="text-xs text-gray-400 mt-1">Select the category that best fits your content</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.value;
              
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategoryChange(cat.value)}
                  className={cn(
                    "w-full p-4 rounded-xl transition-all duration-300 text-left group",
                    "hover:bg-[#1A1B1F] focus:outline-none focus:ring-2 focus:ring-[#0FA84E]/50",
                    "shadow-sm hover:shadow-[0_0_10px_0_rgba(0,0,0,0.6)]",
                    isSelected 
                      ? "bg-[#141517] shadow-[0_0_10px_0_rgba(0,0,0,0.6)]" 
                      : "bg-[#141517]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300",
                      cat.color,
                      isSelected && "scale-105 shadow-xl"
                    )}>
                      <Icon className="w-6 h-6 border-none" stroke="#0FA84E" strokeWidth={2} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm truncate">
                        {cat.label}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                    
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center",
                      isSelected 
                        ? "border-[#0FA84E] bg-[#0FA84E] shadow-sm" 
                        : "border-gray-500 group-hover:border-gray-400"
                    )}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stream Thumbnail */}
        <div className="space-y-4">
          <div>
            <Label className="text-white font-semibold">Stream Thumbnail</Label>
            <p className="text-xs text-gray-400 mt-1">Upload an eye-catching thumbnail for your stream</p>
          </div>

          {thumbnailUrl ? (
            <div className="flex gap-4">
              {/* Thumbnail Preview */}
              <div className="relative group">
                <div className="relative w-64 h-32 rounded-xl overflow-hidden bg-[#141517] shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
                  <Image
                    src={thumbnailUrl}
                    alt="Stream thumbnail"
                    width={256}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay with controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          // Trigger file input for replacement
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              // Handle file upload
                              handleThumbnailUpload(URL.createObjectURL(file));
                            }
                          };
                          input.click();
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Replace
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleThumbnailRemove}
                        className="bg-red-500/80 hover:bg-red-500/90 text-white border-none backdrop-blur-sm"
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Thumbnail info */}
                <div className="mt-2 flex items-center justify-start text-xs text-gray-400">
                  <span className="text-[#0FA84E]">✓ Ready for stream</span>
                </div>
              </div>

              {/* Thumbnail Stats Panel */}
              <div className="flex-1 bg-[#141517] p-4">
                <div className="space-y-3">
                  <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[#0FA84E]" />
                    Thumbnail Stats
                  </h4>
                  
                  {/* Image Dimensions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Dimensions</span>
                      <span className="text-white text-xs font-mono" id="thumbnail-dimensions">
                        Loading...
                      </span>
                    </div>
                    
                    {/* Aspect Ratio */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Aspect Ratio</span>
                      <span className="text-white text-xs font-mono" id="thumbnail-aspect-ratio">
                        Loading...
                      </span>
                    </div>
                    
                    {/* File Size */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">File Size</span>
                      <span className="text-white text-xs font-mono">
                        ~2.3 MB
                      </span>
                    </div>
                  </div>

                  {/* Validation Status */}
                  <div className="pt-2 border-t border-gray-700/50">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#0FA84E]"></div>
                      <span className="text-[#0FA84E] font-medium">Optimal for streaming</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 bg-[#141517] shadow-[0_0_10px_0_rgba(0,0,0,0.6)] transition-all duration-200 hover:border-[#0FA84E]/50 hover:bg-[#1A1B1F] group">
                <UploadDropzone
                  onUploadComplete={handleThumbnailUpload}
                  currentThumbnailUrl={thumbnailUrl}
                  className="min-h-[120px]"
                />
                {/* Upload hint */}
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                    <Upload className="w-4 h-4" />
                    <span>Drag & drop or click to upload</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: 1280x720px, max 5MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end pt-6 border-t border-gray-700/50">
            <Button
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              className={cn(
                "bg-[#0FA84E] hover:bg-[#0FA84E]/90 text-white",
                "shadow-lg hover:shadow-[#0FA84E]/25 transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                "px-6 py-2.5 rounded-sm font-semibold"
              )}
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
