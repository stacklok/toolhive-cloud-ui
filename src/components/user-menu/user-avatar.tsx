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
    <Avatar className="size-9">
      <AvatarFallback className="rounded-full bg-zinc-600/90 text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
