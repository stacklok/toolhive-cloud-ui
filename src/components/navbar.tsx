import { headers } from "next/headers";
import { UserMenu } from "@/components/user-menu";
import { auth } from "@/lib/auth/auth";

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="border-b bg-muted/50">
      <div className="container mx-auto px-4 py-4">
        {session?.user?.name && <UserMenu userName={session.user.name} />}
      </div>
    </header>
  );
}
