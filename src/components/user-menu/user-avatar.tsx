import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  userName: string;
}

/**
 * Extracts initials from a user's full name.
 * Takes the first letter of the first word and last word (max 2 characters).
 * @example getInitials("John Doe") // "JD"
 * @example getInitials("Madonna") // "M"
 * @example getInitials("") // "?"
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";

  // Take first letter of first word and first letter of last word (max 2 chars)
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";

  return (first + last).toUpperCase();
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
