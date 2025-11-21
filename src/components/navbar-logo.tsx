import Image from "next/image";

export function NavbarLogo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/toolhive-icon.svg"
        alt="Toolhive"
        width={17}
        height={19}
        className="shrink-0"
      />
      <span className="text-2xl font-bold tracking-tight">Toolhive</span>
    </div>
  );
}
