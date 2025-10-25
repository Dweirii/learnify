import { useMemo } from "react";
import { Info } from "lucide-react";

import { Hint } from "@/components/shared/hint";

interface ChatInfoProps {
  isDelayed: boolean;
  isFollowersOnly: boolean;
};

export const ChatInfo = ({
  isDelayed,
  isFollowersOnly
}: ChatInfoProps) => {
  const hint = useMemo(() => {
    if (isFollowersOnly && !isDelayed) {
      return "Only followers can chat";
    }

    if (isDelayed && !isFollowersOnly) {
      return "Messages are delayed by 3 seconds";
    }

    if (isDelayed && isFollowersOnly) {
      return "Only followers can chat. Messages are delayed by 3 seconds"
    }

    return "";
  }, [isDelayed, isFollowersOnly]);


  const label = useMemo(() => {
    if (isFollowersOnly && !isDelayed) {
      return "Followers only";
    }

    if (isDelayed && !isFollowersOnly) {
      return "Slow mode";
    }

    if (isDelayed && isFollowersOnly) {
      return "Followers only and slow mode"
    }

    return "";
  }, [isDelayed, isFollowersOnly]);

  if (!isDelayed && !isFollowersOnly) {
    return null;
  }

  return (
    <div className="px-3 py-2.5 text-white/70 bg-white/[0.03] border-b border-white/[0.08] flex items-center gap-x-2">
      <Hint label={hint}>
        <Info className="h-3.5 w-3.5 text-white/30" />
      </Hint>
      <p className="text-xs text-white/50">
        {label}
      </p>
    </div>
  );
};
