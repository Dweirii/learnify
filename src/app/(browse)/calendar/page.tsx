import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CalendarList } from "@/features/calendar/components/browse";

export default async function CalendarPage() {
  const user = await currentUser();
  
  // Require authentication
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-[#141517] px-4 py-8 md:px-6 md:py-10">
      <div className="max-w-7xl mx-auto">
        <CalendarList />
      </div>
    </div>
  );
}

