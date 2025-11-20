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
      <AvatarFallback className="rounded-full bg-[rgba(96,96,96,0.90)] text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
