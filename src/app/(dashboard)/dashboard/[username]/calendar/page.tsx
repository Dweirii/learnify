import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByUsername } from "@/server/services/user.service";
import { CalendarManager } from "@/features/calendar/components";

interface CalendarPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { username } = await params;
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const dbUser = await getUserByUsername(username);
  
  if (!dbUser || dbUser.externalUserId !== user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#141517]">
      <CalendarManager />
    </div>
  );
}
