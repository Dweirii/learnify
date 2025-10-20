import { Suspense } from "react";

import { Navbar } from "@/features/layout/components/browse-navbar";
import { Container } from "@/features/layout/components/browse-container";
import { Sidebar, SidebarSkeleton } from "@/features/layout/components/browse-sidebar";

const BrowseLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return ( 
    <>
      <Navbar />
      <div className="flex h-full pt-20 bg-[#141517]">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
        <Container>
          {children}
        </Container>
      </div>
    </>
  );
};
 
export default BrowseLayout;