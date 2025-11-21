import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getServers } from "../../catalog/actions";
import { CatalogContainer } from "../../catalog/components/catalog-container";

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
        <CatalogContainer servers={servers} />
      </div>
    </div>
  );
}
