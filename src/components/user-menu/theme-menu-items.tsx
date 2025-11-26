"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function ThemeMenuItems() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuItem onSelect={() => setTheme("light")}>
        <Sun />
        Light mode
        {theme === "light" && <Check className="ml-auto" />}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setTheme("dark")}>
        <Moon />
        Dark mode
        {theme === "dark" && <Check className="ml-auto" />}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setTheme("system")}>
        <Monitor />
        Use system settings
        {theme === "system" && <Check className="ml-auto" />}
      </DropdownMenuItem>
    </>
  );
}
