import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getServers } from "./actions";
import { ServersWrapper } from "./components/servers-wrapper";

export default async function CatalogPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  const servers = await getServers();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto space-y-6 py-2">
        <ServersWrapper servers={servers} />
      </div>
    </div>
  );
}
