"use client";

import { useState } from "react";
import { useUser, useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ReauthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReauthModal({ isOpen, onClose, onSuccess }: ReauthModalProps) {
  const { user } = useUser();
  const { signIn, isLoaded } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signIn || !user) {
      toast.error("Authentication service not ready");
      return;
    }

    if (!password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);

    try {
      // Use Clerk's proper re-authentication
      const result = await signIn.attemptFirstFactor({
        strategy: "password",
        password,
      });

      if (result.status === "complete") {
        toast.success("Identity verified successfully");
        onSuccess();
        onClose();
        setPassword("");
      } else {
        toast.error("Invalid password. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Re-authentication error:", error);
      
      const errorObj = error as { errors?: Array<{ code?: string; message?: string }> };
      if (errorObj.errors?.[0]?.code === "form_password_incorrect") {
        toast.error("Incorrect password. Please try again.");
      } else if (errorObj.errors?.[0]?.code === "form_password_pwned") {
        toast.error("This password has been compromised. Please use a different password.");
      } else {
        toast.error(errorObj.errors?.[0]?.message || "Authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    onClose();
  };

  // Check if user signed in with OAuth (no password)
  const isOAuthUser = user?.passwordEnabled === false;

  if (isOAuthUser) {
    // For OAuth users, show a different approach
    return (
      <Dialog open={isOpen} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-md bg-[#141517] border-none shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Verify Your Identity
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              You signed in with a social provider. Please confirm your identity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* User Info */}
            <div className="p-3 bg-gray-800/50 rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0BA84E] flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || "U"}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* OAuth Info */}
            <div className="p-3 bg-[#0BA84E]/10 rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
              <p className="text-sm text-[#0BA84E]">
                You signed in with a social provider. Click confirm to verify your identity.
              </p>
            </div>

            {/* Warning */}
            <div className="p-3 bg-orange-500/10 rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
              <p className="text-sm text-orange-500">
                This action will reset all active streams using your current connection.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isLoading}
                className="text-gray-400 hover:text-white rounded-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast.success("Identity confirmed");
                  onSuccess();
                  onClose();
                }}
                disabled={isLoading}
                className="bg-[#0BA84E] hover:bg-[#0BA84E]/90 text-white shadow-[0_0_10px_0_rgba(0,0,0,0.6)] rounded-sm"
              >
                {isLoading ? "Confirming..." : "Confirm Identity"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // For password users, show password input
  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md bg-[#141517] border-none shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
        <DialogHeader>
          <DialogTitle className="text-white">
            Verify Your Identity
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            For security reasons, please re-enter your password to generate new stream keys.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Info */}
          <div className="p-3 bg-gray-800/50 rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0BA84E] flex items-center justify-center text-white font-semibold">
                {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || "U"}
              </div>
              <div>
                <p className="text-white font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-400 text-sm">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-10 shadow-[0_0_10px_0_rgba(0,0,0,0.6)]"
                required
                disabled={isLoading}
                autoFocus
              />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent rounded-sm"
            >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-orange-500/10 rounded-lg shadow-[0_0_10px_0_rgba(0,0,0,0.6)]">
            <p className="text-sm text-orange-500">
              This action will reset all active streams using your current connection.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isLoading}
              className="text-gray-400 hover:text-white rounded-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="bg-[#0BA84E] hover:bg-[#0BA84E]/90 text-white shadow-[0_0_10px_0_rgba(0,0,0,0.6)] rounded-sm"
            >
              {isLoading ? "Verifying..." : "Verify & Generate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
