"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronIndicator } from "@/components/ui/chevron-indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutMenuItem } from "./sign-out-menu-item";
import { UserAvatar } from "./user-avatar";

interface UserMenuProps {
  userName: string;
}

export function UserMenu({ userName }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <UserAvatar userName={userName} />
          <span>{userName}</span>
          <ChevronIndicator isOpen={isOpen} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
