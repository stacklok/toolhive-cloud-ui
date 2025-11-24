import { headers } from "next/headers";
import { NavbarLogo } from "@/components/navbar-logo";
import { UserMenu } from "@/components/user-menu";
import { auth } from "@/lib/auth/auth";

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="w-full border-b bg-muted/50 flex items-center justify-between pl-8 pr-4 h-16">
      <NavbarLogo />
      {session?.user?.name && <UserMenu userName={session.user.name} />}
    </header>
  );
}
