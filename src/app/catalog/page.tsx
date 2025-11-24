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

  return <ServersWrapper servers={servers} />;
}
