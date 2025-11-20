"use client";

interface UserMenuProps {
  userName: string;
}

export function UserMenu({ userName }: UserMenuProps) {
  return <span>{userName}</span>;
}
