import Image from "next/image";
import Link from "next/link";
import { Toggle } from "./toggle";

export const Logo = () => {
  return (
    <div className="lg:flex items-center gap-x-4">
      <Toggle />
      <Link href="/" className="flex items-center">
        <Image
            src="/logo.png"
            alt="Logo"
            width={100}
            height={50}
            className="inline-block mr-2"
        />
      </Link>
    </div>
  );
}