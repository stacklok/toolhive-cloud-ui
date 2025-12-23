"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { useChatContext } from "@/features/assistant/contexts/chat-context";

export function AssistantSidebarContent() {
  const {
    messages,
    sendMessage,
    status,
    clearError,
    stop,
    error,
    clearMessages,
    selectedModel,
    setSelectedModel,
    conversations,
    currentConversationId,
    loadConversation,
    deleteConversation,
  } = useChatContext();

  const handleNewConversation = () => {
    clearMessages();
  };

  return (
    <div className="flex h-full flex-col">
      <ChatInterface
        messages={messages}
        status={status}
        error={error}
        cancelRequest={async () => {
          await stop();
          clearError();
        }}
        onClearMessages={clearMessages}
        sendMessage={sendMessage}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        onNewConversation={handleNewConversation}
      />
    </div>
  );
}
