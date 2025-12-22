import { Navbar } from "@/components/navbar";
import { SidebarLayout } from "@/components/sidebar-layout";
import { SidebarInset } from "@/components/ui/sidebar";

export default async function CatalogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarLayout>
      <SidebarInset className="flex flex-col h-screen">
        <Navbar />
        <main className="flex flex-col flex-1 overflow-hidden px-4 py-5">
          {children}
        </main>
      </SidebarInset>
    </SidebarLayout>
  );
}
