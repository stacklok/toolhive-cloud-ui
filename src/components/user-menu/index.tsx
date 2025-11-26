"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutMenuItem } from "./sign-out-menu-item";
import { ThemeMenuItems } from "./theme-menu-items";
import { UserMenuButton } from "./user-menu-button";

interface UserMenuProps {
  userName: string;
}

export function UserMenu({ userName }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <UserMenuButton userName={userName} isOpen={isOpen} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <ThemeMenuItems />
        <DropdownMenuSeparator />
        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
