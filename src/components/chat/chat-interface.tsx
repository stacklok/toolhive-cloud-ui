"use client";

import type { ChatStatus, FileUIPart, UIMessage } from "ai";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatHeader } from "./chat-header";
import { ChatInputPrompt } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { ErrorAlert } from "./error-alert";

interface ChatInterfaceProps {
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
  cancelRequest: () => void;
  onClearMessages?: () => void;
  sendMessage: (args: { text: string; files?: FileUIPart[] }) => Promise<void>;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ChatInterface({
  messages,
  status,
  error,
  cancelRequest,
  onClearMessages,
  sendMessage,
  selectedModel,
  onModelChange,
}: ChatInterfaceProps) {
  const {
    messagesEndRef,
    messagesContainerRef,
    showScrollButton: showScrollToBottom,
    scrollToBottom,
  } = useAutoScroll({ messagesLength: messages.length });

  const isLoading = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col px-8 pb-4">
      <ChatHeader hasMessages={hasMessages} onClearMessages={onClearMessages} />

      {hasMessages && <Separator />}

      <div className="relative flex-1 overflow-hidden">
        {hasMessages ? (
          <ChatMessages
            messages={messages}
            status={status}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
            messagesContainerRef={messagesContainerRef}
          />
        ) : (
          <ChatEmptyState
            status={status}
            onSendMessage={sendMessage}
            onStopGeneration={cancelRequest}
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
        )}

        {showScrollToBottom && (
          <Button
            size="sm"
            variant="secondary"
            className="animate-in fade-in-0 slide-in-from-bottom-2 absolute bottom-4 left-1/2 z-50 h-10 w-10 -translate-x-1/2 cursor-pointer rounded-full p-0 duration-200"
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ErrorAlert error={error?.message ?? null} />

      {hasMessages && (
        <div className="w-full">
          <ChatInputPrompt
            onStopGeneration={cancelRequest}
            hasProviderAndModel={true}
            status={status}
            onSendMessage={sendMessage}
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
        </div>
      )}
    </div>
  );
}
