import { getOpenRouterModels } from "./actions";
import { AssistantChat } from "./assistant-chat";
import { ModelsProvider } from "./models-context";

export default async function AssistantPage() {
  const models = await getOpenRouterModels();

  return (
    <ModelsProvider models={models}>
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex-1 overflow-hidden">
          <AssistantChat />
        </div>
      </div>
    </ModelsProvider>
  );
}
