"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConnectModal } from "@/features/stream/components/connect-modal";
import { Copy, Eye, EyeOff, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StreamKeysCardProps {
  serverUrl: string | null;
  streamKey: string | null;
}

export function StreamKeysCard({ serverUrl, streamKey }: StreamKeysCardProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded by default
  const [showServerUrl, setShowServerUrl] = useState(false);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const maskKey = (key: string | null) => {
    if (!key || key.length <= 8) return "••••••••";
    return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
  };

  const handleShowStreamKey = () => {
    if (!showStreamKey) {
      setShowWarningModal(true);
    } else {
      setShowStreamKey(false);
    }
  };

  const confirmShowStreamKey = () => {
    setShowStreamKey(true);
    setShowWarningModal(false);
  };

  return (
    <>
    <Card className="bg-transparent  shadow-[0_0_10px_0_rgba(0,0,0,0.6)] border-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="text-white">
            Stream Keys
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-sm"
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
                className="border-gray-700 text-gray-400 hover:text-white rounded-sm"
              >
                {showServerUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(serverUrl || "", "Server URL")}
                className="border-gray-700 text-gray-400 hover:text-white rounded-sm"
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
                onClick={handleShowStreamKey}
                className="border-gray-700 text-gray-400 hover:text-white rounded-sm"
              >
                {showStreamKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(streamKey || "", "Stream Key")}
                className="border-gray-700 text-gray-400 hover:text-white rounded-sm"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Connect Modal */}
          <div className="flex justify-end pt-4">
            <ConnectModal />
          </div>
        </CardContent>
      )}
    </Card>

    {/* Warning Modal */}
    <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
      <DialogContent className="sm:max-w-md bg-[#141517] border-none shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Security Warning
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Please read this important security notice before revealing your stream key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-orange-500/10 rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-orange-500 font-semibold mb-2">Keep Your Stream Key Private</h4>
                <p className="text-orange-400 text-sm">
                  Anyone with this key can stream to your channel. Never share it publicly or with unauthorized users.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowWarningModal(false)}
              className="text-gray-400 hover:text-white rounded-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmShowStreamKey}
              className="bg-[#0BA84E] hover:bg-[#0BA84E]/90 text-white shadow-[0_0_10px_0_rgba(0,0,0,0.6)] rounded-sm"
            >
              I Understand, Show Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
