import Image from "next/image";
import Link from "next/link";

export function NavbarLogo() {
  return (
    <Link href="/catalog" className="flex items-center">
      <Image
        src="/toolhive-logo.svg"
        alt="ToolHive"
        width={138}
        height={30}
        className="shrink-0"
      />
    </Link>
  );
}
