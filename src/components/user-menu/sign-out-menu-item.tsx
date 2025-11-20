import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/auth-client";

export function SignOutMenuItem() {
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <DropdownMenuItem onSelect={handleSignOut}>
      <LogOut />
      Sign out
    </DropdownMenuItem>
  );
}
