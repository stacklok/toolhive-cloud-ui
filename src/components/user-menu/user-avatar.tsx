import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  userName: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function UserAvatar({ userName }: UserAvatarProps) {
  const initials = getInitials(userName);

  return (
    <Avatar>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
