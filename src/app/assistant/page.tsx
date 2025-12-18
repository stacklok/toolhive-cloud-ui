import { getServers } from "@/app/catalog/actions";
import { getOpenRouterModels } from "./actions";
import { AssistantChat } from "./assistant-chat";
import { McpSettingsProvider } from "./mcp-settings-context";
import { ModelsProvider } from "./models-context";

export default async function AssistantPage() {
  const [models, servers] = await Promise.all([
    getOpenRouterModels(),
    getServers(),
  ]);

  return (
    <ModelsProvider models={models}>
      <McpSettingsProvider initialServers={servers}>
        <div className="flex h-[calc(100vh-4rem)] flex-col">
          <div className="flex-1 overflow-hidden">
            <AssistantChat />
          </div>
        </div>
      </McpSettingsProvider>
    </ModelsProvider>
  );
}
