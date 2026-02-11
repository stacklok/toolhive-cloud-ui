import { headers } from "next/headers";
import { NavbarLogo } from "@/components/navbar-logo";
import { UserMenu } from "@/components/user-menu";
import { AssistantTrigger } from "@/features/assistant";
import { auth } from "@/lib/auth/auth";

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="w-full border-b border-nav-border bg-nav-background text-white flex items-center justify-between pl-4 pr-4 h-16">
      <NavbarLogo />
      <div className="flex items-center h-full">
        {session?.user?.name && <UserMenu userName={session.user.name} />}
        <div className="mx-4 h-full w-px bg-muted-foreground/30" />
        <AssistantTrigger />
      </div>
    </header>
  );
}
