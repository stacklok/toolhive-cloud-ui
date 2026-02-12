import { AssistantLayout } from "@/components/assistant-layout";
import { Navbar } from "@/components/navbar";
import { SidebarInset } from "@/components/ui/sidebar";

export default async function CatalogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AssistantLayout>
      <SidebarInset className="flex flex-col h-screen min-w-0">
        <Navbar />
        <main className="flex flex-col flex-1 overflow-hidden px-8 py-5 bg-[hsl(40_20%_98.5%)] dark:bg-background">
          {children}
        </main>
      </SidebarInset>
    </AssistantLayout>
  );
}
