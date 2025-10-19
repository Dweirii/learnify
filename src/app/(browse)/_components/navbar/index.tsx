import { Actions } from "./actions";
import { Logo } from "./logo";
import { SearchBar } from "./search";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full h-20 z-[49] px-2 lg:px-4 flex justify-between items-center shadow-sm bg-white dark:bg-[#141517]">
      <Logo />
      <SearchBar />
      <Actions />
    </nav>
  );
}