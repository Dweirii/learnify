import { Logo } from "./logo";
import { Actions } from "./actions";
import { ThemeToggle } from "@/components/theme-toggle";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full h-20 z-[49] bg-background/95 backdrop-blur-sm border-b border-border px-2 lg:px-4 flex justify-between items-center shadow-sm">
      <Logo />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Actions />
      </div>
    </nav>
  );
};
