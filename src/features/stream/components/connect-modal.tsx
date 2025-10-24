"use client";

import { toast } from "sonner";
import { useState, useTransition, useRef, ElementRef } from "react";
import { AlertTriangle } from "lucide-react";

import { createIngress } from "@/server/actions/ingress";
import { checkSessionVerification, markSessionAsVerified } from "@/server/actions/verify-session";
import { ReauthModal } from "@/features/stream/components/reauth-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✅ Removed `livekit-server-sdk` import (server-only)
// Use simple constants instead
const RTMP = "1"; // corresponds to IngressInput.RTMP_INPUT
const WHIP = "2"; // corresponds to IngressInput.WHIP_INPUT
type IngressType = typeof RTMP | typeof WHIP;

export const ConnectModal = () => {
  const closeRef = useRef<ElementRef<"button">>(null);
  const [isPending, startTransition] = useTransition();
  const [ingressType, setIngressType] = useState<IngressType>(RTMP);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const handleGenerateKeys = async () => {
    setIsCheckingAuth(true);
    
    try {
      // Check if user needs to re-authenticate
      const verification = await checkSessionVerification();
      
      if (verification.requiresReauth) {
        setShowReauthModal(true);
        setIsCheckingAuth(false);
        return;
      }
      
      // User is verified, proceed with key generation
      await generateKeys();
    } catch (error) {
      console.error("Auth check error:", error);
      toast.error("Failed to verify authentication");
      setIsCheckingAuth(false);
    }
  };

  const generateKeys = async () => {
    startTransition(() => {
      createIngress(parseInt(ingressType))
        .then(async () => {
          // Mark session as verified after successful key generation
          await markSessionAsVerified();
          toast.success("Stream keys generated successfully");
          closeRef?.current?.click();
        })
        .catch(() => toast.error("Something went wrong"));
    });
  };

  const handleReauthSuccess = async () => {
    setShowReauthModal(false);
    await generateKeys();
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default" className="bg-[#0BA84E] hover:bg-[#0BA84E]/90 text-white shadow-[0_0_10px_0_rgba(0,0,0,0.6)] rounded-sm">
            Generate connection
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#141517] border-none shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Generate Stream Keys
            </DialogTitle>
          </DialogHeader>
          <Select
            disabled={isPending || isCheckingAuth}
            value={ingressType}
            onValueChange={(value) => setIngressType(value as IngressType)}
          >
            <SelectTrigger className="w-full bg-[#141517] border-none text-white focus:ring-[#0FA84E]/20 shadow-sm">
              <SelectValue placeholder="Ingress Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#141517] border-none shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
              <SelectItem value={RTMP} className="text-white hover:bg-[#1A1B1F] focus:bg-[#1A1B1F]">RTMP</SelectItem>
              <SelectItem value={WHIP} className="text-white hover:bg-[#1A1B1F] focus:bg-[#1A1B1F]">WHIP</SelectItem>
            </SelectContent>
          </Select>
          <Alert className="bg-orange-500/10 border-orange-500/20 shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertTitle className="text-orange-500">Security Notice</AlertTitle>
            <AlertDescription className="text-orange-400">
              This action will reset all active streams using the current connection. 
              You may be asked to verify your identity for security.
            </AlertDescription>
          </Alert>
          <div className="flex justify-between mt-4">
            <DialogClose ref={closeRef}>
              <Button variant="ghost" className="text-gray-400 hover:text-white rounded-sm">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              disabled={isPending || isCheckingAuth} 
              onClick={handleGenerateKeys} 
              variant="default"
              className="bg-[#0BA84E] hover:bg-[#0BA84E]/90 text-white shadow-[0_0_10px_0_rgba(0,0,0,0.6)] rounded-sm"
            >
              {isCheckingAuth ? "Checking..." : isPending ? "Generating..." : "Generate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ReauthModal
        isOpen={showReauthModal}
        onClose={() => setShowReauthModal(false)}
        onSuccess={handleReauthSuccess}
      />
    </>
  );
};
