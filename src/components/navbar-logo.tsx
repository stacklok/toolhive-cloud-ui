import { ToolHiveIcon } from "@/components/icons";

export function NavbarLogo() {
  return (
    <div className="flex items-center gap-2">
      <ToolHiveIcon className="size-5 shrink-0" />
      <span className="text-2xl font-bold tracking-tight">ToolHive</span>
    </div>
  );
}
