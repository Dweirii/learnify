import { getSelf } from "@/server/services/auth.service";
import { getStreamByUserId } from "@/server/services/stream.service";
import { db } from "@/lib/db";
import { SettingsPageClient } from "./settings-page";

export default async function SettingsPage() {
  const self = await getSelf();
  const stream = await getStreamByUserId(self.id);

  if (!stream) {
    throw new Error("Stream not found");
  }

  // Fetch user's social links
  const socialLinks = await db.socialLink.findMany({
    where: {
      userId: self.id,
    },
    orderBy: {
      order: 'asc',
    },
  });

  return (
    <SettingsPageClient
      user={{
        id: self.id,
        username: self.username,
        bio: self.bio,
      }}
      stream={{
        name: stream.name,
        category: stream.category,
        thumbnailUrl: stream.thumbnailUrl,
        isChatEnabled: stream.isChatEnabled,
        isChatDelayed: stream.isChatDelayed,
        isChatFollowersOnly: stream.isChatFollowersOnly,
        serverUrl: stream.serverUrl,
        streamKey: stream.streamKey,
      }}
      socialLinks={socialLinks}
    />
  );
}
