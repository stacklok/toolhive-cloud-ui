import { headers } from "next/headers";
import { NavbarLogo } from "@/components/navbar-logo";
import { UserMenu } from "@/components/user-menu";
import { auth } from "@/lib/auth/auth";

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="w-full border-b bg-muted/50">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <NavbarLogo />
        {session?.user?.name && <UserMenu userName={session.user.name} />}
      </div>
    </header>
  );
}
