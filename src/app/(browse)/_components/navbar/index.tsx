import { Actions } from "./actions";
import { Logo } from "./logo";
import { SearchBar } from "./search";
import { ThemeProvider } from "@/components/theme-provider";
import { NavbarSkeleton } from "./navbar-skeleton";

export const Navbar = ({ isLoading = false }: { isLoading?: boolean }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {isLoading ? (
        <NavbarSkeleton />
      ) : (
        <nav className="fixed top-0 left-0 w-full h-20 z-[49] px-2 lg:px-4 flex justify-between items-center shadow-sm bg-white dark:bg-[#141517]">
          <Logo />
          <SearchBar />
          <Actions />
        </nav>
      )}
    </ThemeProvider>
  );
}