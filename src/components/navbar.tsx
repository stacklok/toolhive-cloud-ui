import { headers } from "next/headers";
import { AssistantTrigger } from "@/components/assistant-trigger";
import { NavbarLogo } from "@/components/navbar-logo";
import { UserMenu } from "@/components/user-menu";
import { auth } from "@/lib/auth/auth";

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="w-full border-b bg-muted/50 flex items-center justify-between pl-4 pr-4 h-16">
      <div className="flex items-center">
        <AssistantTrigger />
        <div className="ml-2 mr-4 h-6 w-px bg-muted-foreground/30" />
        <NavbarLogo />
      </div>
      {session?.user?.name && <UserMenu userName={session.user.name} />}
    </header>
  );
}
