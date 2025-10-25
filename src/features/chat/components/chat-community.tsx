"use client";

import { useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useParticipants } from "@livekit/components-react";
import { LocalParticipant, RemoteParticipant } from "livekit-client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CommunityItem } from "@/features/stream/components/stream-player/community-item";

interface ChatCommunityProps {
  hostName: string;
  viewerName: string;
  isHidden: boolean;
};

export const ChatCommunity = ({
  hostName,
  viewerName,
  isHidden
}: ChatCommunityProps) => {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounceValue<string>(value, 500);

  const participants = useParticipants();

  const onChange = (newValue: string) => {
    setValue(newValue);
  };

  const filteredParticipants = useMemo(() => {
    const deduped = participants.reduce((acc, participant) => {
      const hostAsViewer = `host-${participant.identity}`;
      if (!acc.some((p) => p.identity === hostAsViewer)) {
        acc.push(participant);
      }
      return acc;
    }, [] as (RemoteParticipant | LocalParticipant)[]);

    return deduped.filter((participant) => {
      return participant.name?.toLowerCase().includes(debouncedValue[0].toLowerCase())
    });
  }, [participants, debouncedValue]);
 
  if (isHidden) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-white/50">
          Community is disabled
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Input
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search community"
        className="bg-[#141517] border-white/10 text-white placeholder:text-white/40 focus-visible:border-[#0FA851] focus-visible:ring-[#0FA851]/30 shadow-[0_0_10px_0_rgba(0,0,0,0.6)]"
      />
      <ScrollArea className="gap-y-2 mt-4">
        <p className="text-center text-sm text-white/50 hidden last:block p-2">
          No results
        </p>
        {filteredParticipants.map((participant) => (
          <CommunityItem
            key={participant.identity}
            hostName={hostName}
            viewerName={viewerName}
            participantName={participant.name}
            participantIdentity={participant.identity}
          />
        ))}
      </ScrollArea>
    </div>
  )
}