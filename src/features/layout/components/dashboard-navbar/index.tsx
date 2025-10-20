import { Logo } from "./logo";
import { Actions } from "./actions";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full h-20 z-[49] px-2 lg:px-4 flex justify-between items-center shadow-[0_0_10px_0_rgba(0,0,0,0.6)] bg-[#141517]">
      <Logo />
      <div className="flex items-center gap-2">
        <Actions />
      </div>
    </nav>
  );
};
