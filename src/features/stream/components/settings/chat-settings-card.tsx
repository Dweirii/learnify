"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateStream } from "@/server/actions/stream";
import { MessageSquare, Save } from "lucide-react";

interface ChatSettingsCardProps {
  initialIsChatEnabled: boolean;
  initialIsChatDelayed: boolean;
  initialIsChatFollowersOnly: boolean;
}

export function ChatSettingsCard({ 
  initialIsChatEnabled, 
  initialIsChatDelayed, 
  initialIsChatFollowersOnly 
}: ChatSettingsCardProps) {
  const [isChatEnabled, setIsChatEnabled] = useState(initialIsChatEnabled);
  const [isChatDelayed, setIsChatDelayed] = useState(initialIsChatDelayed);
  const [isChatFollowersOnly, setIsChatFollowersOnly] = useState(initialIsChatFollowersOnly);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (field: string, value: boolean) => {
    switch (field) {
      case "isChatEnabled":
        setIsChatEnabled(value);
        break;
      case "isChatDelayed":
        setIsChatDelayed(value);
        break;
      case "isChatFollowersOnly":
        setIsChatFollowersOnly(value);
        break;
    }
    
    setHasChanges(
      isChatEnabled !== initialIsChatEnabled ||
      isChatDelayed !== initialIsChatDelayed ||
      isChatFollowersOnly !== initialIsChatFollowersOnly ||
      (field === "isChatEnabled" && value !== initialIsChatEnabled) ||
      (field === "isChatDelayed" && value !== initialIsChatDelayed) ||
      (field === "isChatFollowersOnly" && value !== initialIsChatFollowersOnly)
    );
  };

  const handleSave = () => {
    startTransition(() => {
      updateStream({ 
        isChatEnabled,
        isChatDelayed,
        isChatFollowersOnly
      })
        .then(() => {
          toast.success("Chat settings updated successfully");
          setHasChanges(false);
        })
        .catch(() => {
          toast.error("Failed to update chat settings");
        });
    });
  };

  return (
    <Card className="bg-transparent  shadow-[0_0_10px_0_rgba(0,0,0,0.6)] border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          Chat Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Chat */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="enable-chat" className="text-white">
              Enable Chat
            </Label>
            <p className="text-sm text-gray-400">
              Allow viewers to send messages in your chat
            </p>
          </div>
          <Switch
            id="enable-chat"
            checked={isChatEnabled}
            onCheckedChange={(checked) => handleToggle("isChatEnabled", checked)}
            disabled={isPending}
          />
        </div>

        {/* Delay Chat */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="delay-chat" className="text-white">
              Delay Chat
            </Label>
            <p className="text-sm text-gray-400">
              Add a delay to chat messages (helps with moderation)
            </p>
          </div>
          <Switch
            id="delay-chat"
            checked={isChatDelayed}
            onCheckedChange={(checked) => handleToggle("isChatDelayed", checked)}
            disabled={isPending || !isChatEnabled}
          />
        </div>

        {/* Followers Only Chat */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="followers-only" className="text-white">
              Followers Only Chat
            </Label>
            <p className="text-sm text-gray-400">
              Only followers can send messages in chat
            </p>
          </div>
          <Switch
            id="followers-only"
            checked={isChatFollowersOnly}
            onCheckedChange={(checked) => handleToggle("isChatFollowersOnly", checked)}
            disabled={isPending || !isChatEnabled}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-800">
          <Button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="bg-gradient-to-r from-[#08A84F] to-[#08A84F]/90 hover:from-[#08A84F]/90 hover:to-[#08A84F] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
