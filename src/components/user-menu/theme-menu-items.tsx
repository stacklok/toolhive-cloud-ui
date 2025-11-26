"use client";

import { useTheme } from "next-themes";
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export function ThemeMenuItems() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
        <DropdownMenuRadioItem value="light">Light mode</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="dark">Dark mode</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="system">
          Use system settings
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
}
