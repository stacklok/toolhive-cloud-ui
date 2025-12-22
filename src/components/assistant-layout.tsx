import { getServers } from "@/app/catalog/actions";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  AssistantSidebar,
  ChatProvider,
  getOpenRouterModels,
  McpSettingsProvider,
  ModelsProvider,
} from "@/features/assistant";

interface AssistantLayoutProps {
  children: React.ReactNode;
}

export async function AssistantLayout({ children }: AssistantLayoutProps) {
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
