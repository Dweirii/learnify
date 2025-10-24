"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConnectModal } from "@/features/stream/components/connect-modal";
import { KeyRound, Copy, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamKeysCardProps {
  serverUrl: string | null;
  streamKey: string | null;
}

export function StreamKeysCard({ serverUrl, streamKey }: StreamKeysCardProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded by default
  const [showServerUrl, setShowServerUrl] = useState(false);
  const [showStreamKey, setShowStreamKey] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const maskKey = (key: string | null) => {
    if (!key || key.length <= 8) return "••••••••";
    return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
  };

  return (
    <Card className="bg-transparent  shadow-[0_0_10px_0_rgba(0,0,0,0.6)] border-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            Stream Keys
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Server URL */}
          <div className="space-y-2">
            <Label className="text-white">Server URL (RTMP)</Label>
            <div className="flex gap-2">
              <Input
                value={showServerUrl ? (serverUrl || "") : maskKey(serverUrl)}
                readOnly
                className="bg-gray-800/50 border-gray-700 text-white font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowServerUrl(!showServerUrl)}
                className="border-gray-700 text-gray-400 hover:text-white"
              >
                {showServerUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(serverUrl || "", "Server URL")}
                className="border-gray-700 text-gray-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stream Key */}
          <div className="space-y-2">
            <Label className="text-white">Stream Key</Label>
            <div className="flex gap-2">
              <Input
                value={showStreamKey ? (streamKey || "") : maskKey(streamKey)}
                readOnly
                className="bg-gray-800/50 border-gray-700 text-white font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStreamKey(!showStreamKey)}
                className="border-gray-700 text-gray-400 hover:text-white"
              >
                {showStreamKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(streamKey || "", "Stream Key")}
                className="border-gray-700 text-gray-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Connect Modal */}
          <div className="flex justify-center pt-4 border-t border-gray-800">
            <ConnectModal />
          </div>

          {/* Warning */}
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-sm text-orange-500">
              ⚠️ Keep your stream key private. Anyone with this key can stream to your channel.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
