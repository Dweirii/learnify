import { redirect } from "next/navigation";

import { getSelfByUsername } from "@/server/services/auth.service";

import { Navbar } from "@/features/layout/components/dashboard-navbar";
import { Sidebar } from "@/features/layout/components/dashboard-sidebar";
import { Container } from "@/features/layout/components/dashboard-container";

interface CreatorLayoutProps {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
};

const CreatorLayout = async ({
  params,
  children,
}: CreatorLayoutProps) => {
  const { username } = await params;
  const self = await getSelfByUsername(username);

  if (!self) {
    redirect("/");
  }

  return ( 
    <>
      <Navbar />
      <div className="flex h-full pt-20">
        <Sidebar />
        <Container>
          {children}
        </Container>
      </div>
    </>
  );
}
 
export default CreatorLayout;