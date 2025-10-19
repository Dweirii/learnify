import { StreamPlayerSkeleton } from "@/features/stream/components/stream-player";

const UserLoading = () => {
  return ( 
    <div className="h-full">
      <StreamPlayerSkeleton />
    </div>
  );
};
 
export default UserLoading;