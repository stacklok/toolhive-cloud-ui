import Image from "next/image";
import Link from "next/link";

export function NavbarLogo() {
  return (
    <Link href="/catalog" className="flex items-center">
      <Image
        src="/toolhive-logo.png"
        alt="ToolHive"
        width={145}
        height={31}
        className="shrink-0"
      />
    </Link>
  );
}
