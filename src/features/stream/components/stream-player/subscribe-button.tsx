"use client";

import { useState } from "react";
import { Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const SubscribeButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClick = () => {
    setIsDialogOpen(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="w-full lg:w-auto gap-2 opacity-60 cursor-not-allowed"
        disabled
      >
        <Crown className="h-4 w-4" />
        Subscribe
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <span>Coming Soon!</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              Subscription features are currently in development. Soon you'll be able to subscribe to your favorite streamers and get exclusive benefits!
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">What's coming:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Subscribe to streamers</li>
              <li>• Exclusive subscriber-only content</li>
              <li>• Priority chat access</li>
              <li>• Special subscriber badges</li>
              <li>• Early access to new features</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsDialogOpen(false)}
              className="w-full"
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
