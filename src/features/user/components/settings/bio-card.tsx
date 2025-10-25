"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateUser } from "@/server/actions/user";
import { FileText } from "lucide-react";

interface BioCardProps {
  initialBio: string | null;
}

export function BioCard({ initialBio }: BioCardProps) {
  const [bio, setBio] = useState(initialBio || "");
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);

  const handleBioChange = (value: string) => {
    setBio(value);
    setHasChanges(value !== (initialBio || ""));
  };

  const handleSave = () => {
    if (bio.length > 500) {
      toast.error("Bio must be 500 characters or less");
      return;
    }

    startTransition(() => {
      updateUser({ bio })
        .then(() => {
          toast.success("Bio updated successfully");
          setHasChanges(false);
        })
        .catch((error) => {
          console.error("BioCard - updateUser error:", error);
          toast.error("Failed to update bio");
        });
    });
  };

  return (
    <Card className="bg-transparent  shadow-[0_0_10px_0_rgba(0,0,0,0.6)] border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText className="w-5 h-5 text-[#08A84F]" />
          About You
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Tell your viewers about yourself..."
            value={bio}
            onChange={(e) => handleBioChange(e.target.value)}
            disabled={isPending}
            className="min-h-[120px] resize-none bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {bio.length}/500 characters
            </span>
            {hasChanges && (
              <span className="text-xs text-[#08A84F]">
                You have unsaved changes
              </span>
            )}
          </div>
        </div>

        {hasChanges && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              className="bg-[#0FA84E] hover:bg-[#0FA84E]/90 text-white shadow-lg hover:shadow-[#0FA84E]/25 transition-all duration-200 px-6 py-2.5 rounded-sm font-semibold"
            >
              {isPending ? "Saving..." : "Save Bio"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
