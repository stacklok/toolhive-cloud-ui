"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserMenuProps {
  userName: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function UserMenu({ userName }: UserMenuProps) {
  const initials = getInitials(userName);

  return (
    <div className="flex items-center gap-2">
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span>{userName}</span>
    </div>
  );
}
