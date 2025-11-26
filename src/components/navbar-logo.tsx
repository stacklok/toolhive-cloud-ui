import { ToolhiveIcon } from "@/components/toolhive-icon";

export function NavbarLogo() {
  return (
    <div className="flex items-center gap-2">
      <ToolhiveIcon size={24} className="shrink-0" />
      <span className="text-2xl font-bold tracking-tight">ToolHive</span>
    </div>
  );
}
