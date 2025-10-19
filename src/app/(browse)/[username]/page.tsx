import { notFound } from "next/navigation";

import { getUserByUsername } from "@/server/services/user.service";
import { isFollowingUser } from "@/server/services/follow.service";
import { isBlockedByUser } from "@/server/services/block.service";
import { StreamPlayer } from "@/components/stream-player";

interface UserPageProps {
  params: Promise<{
    username: string;
  }>;
};

const UserPage = async ({
  params
}: UserPageProps) => {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user || !user.stream) {
    notFound();
  }

  const isFollowing = await isFollowingUser(user.id);
  const isBlocked = await isBlockedByUser(user.id);

  if (isBlocked) {
    notFound();
  }

  return ( 
    <StreamPlayer
      user={user}
      stream={user.stream}
      isFollowing={isFollowing}
    />
  );
}
 
export default UserPage;