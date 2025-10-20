import { getFollowedUsers } from "@/server/services/follow.service";
import { getRecommended } from "@/server/services/recommended.service";
import { SerializedFollow, SerializedUserWithStream } from "@/types";

import { Wrapper } from "./wrapper";
import { Following, FollowingSkeleton } from "./following";
import { 
  Recommended, 
  RecommendedSkeleton
} from "./recommended";
import SidebarItems from "./sidebar-items";


export const Sidebar = async () => {
  const recommended = await getRecommended() as SerializedUserWithStream[];
  const following = await getFollowedUsers() as SerializedFollow[];

  return (
    <Wrapper>
      <div className="space-y-4 pt-4 lg:pt-0">
        <SidebarItems />
        <Following data={following} />
        <Recommended data={recommended} />
      </div>
    </Wrapper>
  );
};

export const SidebarSkeleton = () => {
  return (
    <aside className="fixed left-0 flex flex-col w-[70px] lg:w-60 h-full bg-background sidebar-shadow z-50 p-4">
      <div className="space-y-4 pt-4 lg:pt-0">
        <FollowingSkeleton />
        <RecommendedSkeleton />
      </div>
    </aside>
  );
};
