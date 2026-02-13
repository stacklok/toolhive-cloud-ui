"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export type Theme = "light" | "dark" | "system";

interface ThemeMenuItemProps {
  children: ReactNode;
  theme: Theme;
}

function ThemeMenuItem({ children, theme }: ThemeMenuItemProps) {
  const { theme: activeTheme, setTheme } = useTheme();
  const isActive = activeTheme === theme;

  return (
    <DropdownMenuItem onSelect={() => setTheme(theme)}>
      {children}
      {isActive && <Check className="ml-auto" />}
    </DropdownMenuItem>
  );
}

export function ThemeMenuItems() {
  return (
    <>
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <ThemeMenuItem theme="light">
        <Sun />
        Light mode
      </ThemeMenuItem>
      <ThemeMenuItem theme="dark">
        <Moon />
        Dark mode
      </ThemeMenuItem>
      <ThemeMenuItem theme="system">
        <Monitor />
        Use system settings
      </ThemeMenuItem>
    </>
  );
}
