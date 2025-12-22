import { getOpenRouterModels } from "@/app/assistant/actions";
import { ChatProvider } from "@/app/assistant/chat-context";
import { McpSettingsProvider } from "@/app/assistant/mcp-settings-context";
import { ModelsProvider } from "@/app/assistant/models-context";
import { getServers } from "@/app/catalog/actions";
import { AssistantSidebar } from "@/components/assistant-sidebar/assistant-sidebar";
import { ErrorBoundary } from "@/components/ui/error-boundary";
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
        <ChatProvider>
          <SidebarProvider defaultOpen={false}>
            {children}
            <ErrorBoundary>
              <AssistantSidebar />
            </ErrorBoundary>
          </SidebarProvider>
        </ChatProvider>
      </McpSettingsProvider>
    </ModelsProvider>
  );
}
