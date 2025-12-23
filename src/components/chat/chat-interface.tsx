"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useChatContext } from "@/features/assistant/contexts/chat-context";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatHeader } from "./chat-header";
import { ChatInputPrompt } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { ErrorAlert } from "./error-alert";

export function ChatInterface() {
  const {
    messages,
    status,
    error,
    stop,
    clearError,
    sendMessage,
    selectedModel,
    setSelectedModel,
    clearMessages,
    conversations,
    currentConversationId,
    loadConversation,
    deleteConversation,
  } = useChatContext();

  const {
    messagesEndRef,
    messagesContainerRef,
    showScrollButton: showScrollToBottom,
    scrollToBottom,
  } = useAutoScroll({ messagesLength: messages.length });

  const isLoading = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  const handleCancelRequest = async () => {
    await stop();
    clearError();
  };

  const handleNewConversation = () => {
    clearMessages();
  };

  return (
    <div className="flex h-full flex-col px-8 pb-4">
      <ChatHeader
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        onNewConversation={handleNewConversation}
      />

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
            onStopGeneration={handleCancelRequest}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        )}

        {showScrollToBottom && (
          <Button
            size="sm"
            variant="secondary"
            className="animate-in fade-in-0 slide-in-from-bottom-2 absolute bottom-4 left-1/2 z-50 size-10 -translate-x-1/2 cursor-pointer rounded-full p-0 duration-200"
            onClick={scrollToBottom}
          >
            <ChevronDown className="size-4" />
          </Button>
        )}
      </div>

      <ErrorAlert error={error?.message ?? null} />

      {hasMessages && (
        <div className="w-full">
          <ChatInputPrompt
            onStopGeneration={handleCancelRequest}
            hasProviderAndModel={true}
            status={status}
            onSendMessage={sendMessage}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      )}
    </div>
  );
}
