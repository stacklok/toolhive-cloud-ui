import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/auth-client";

export function SignOutMenuItem() {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <DropdownMenuItem onSelect={handleSignOut}>
      <LogOut />
      Sign out
    </DropdownMenuItem>
  );
}
