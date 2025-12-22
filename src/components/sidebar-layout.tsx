import { getOpenRouterModels } from "@/app/assistant/actions";
import { McpSettingsProvider } from "@/app/assistant/mcp-settings-context";
import { ModelsProvider } from "@/app/assistant/models-context";
import { getServers } from "@/app/catalog/actions";
import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export async function SidebarLayout({ children }: SidebarLayoutProps) {
  const [models, servers] = await Promise.all([
    getOpenRouterModels(),
    getServers(),
  ]);

  return (
    <ModelsProvider models={models}>
      <McpSettingsProvider initialServers={servers}>
        <SidebarProvider defaultOpen={false}>
          {children}
          <AppSidebar />
        </SidebarProvider>
      </McpSettingsProvider>
    </ModelsProvider>
  );
}
