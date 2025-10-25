import { currentUser } from "@clerk/nextjs/server";

import { getUserByUsername } from "@/server/services/user.service";
import { StreamPlayer } from "@/features/stream/components/stream-player";
import { XPService } from "@/server/services/xp.service";

interface CreatorPageProps {
  params: Promise<{
    username: string;
  }>;
};

const CreatorPage = async ({
  params,
}: CreatorPageProps) => {
  const { username } = await params;
  const externalUser = await currentUser();
  const user = await getUserByUsername(username);

  if (!user || user.externalUserId !== externalUser?.id || !user.stream) {
    throw new Error("Unauthorized");
  }

  // Fetch user stats for gamification
  const userStats = await XPService.getUserStats(user.id);

  return ( 
    <div className="h-full">
      <StreamPlayer
        user={user}
        stream={user.stream}
        isFollowing
        userStats={userStats}
      />
    </div>
  );
}
 
export default CreatorPage;