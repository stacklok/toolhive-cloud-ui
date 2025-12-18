import type { ChatStatus, FileUIPart } from "ai";
import { MessageCircleMore } from "lucide-react";
import { ChatInputPrompt } from "./chat-input";

interface ChatEmptyStateProps {
  status: ChatStatus;
  onSendMessage: (message: {
    text: string;
    files?: FileUIPart[];
  }) => Promise<void>;
  onStopGeneration: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ChatEmptyState({
  status,
  onSendMessage,
  onStopGeneration,
  selectedModel,
  onModelChange,
}: ChatEmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div>
          <MessageCircleMore
            strokeWidth={1}
            size={80}
            className="text-muted-foreground mx-auto mb-4 scale-x-[-1]"
          />
          <h2 className="text-foreground text-2xl font-bold">
            Test & evaluate your MCP Servers
          </h2>
          <p className="text-muted-foreground mt-2">
            Send a message to start chatting with the AI assistant
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <ChatInputPrompt
            onStopGeneration={onStopGeneration}
            hasProviderAndModel={true}
            status={status}
            onSendMessage={onSendMessage}
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
        </div>
      </div>
    </div>
  );
}
