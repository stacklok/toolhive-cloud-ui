"use client";

import { useChat } from "@ai-sdk/react";
import { createContext, useContext, useState } from "react";
import { DEFAULT_MODEL } from "@/features/assistant/constants";
import { useChatHistory } from "@/features/assistant/hooks/use-chat-history";
import { useChatPersistence } from "@/features/assistant/hooks/use-chat-persistence";
import { useChatTransport } from "@/features/assistant/hooks/use-chat-transport";
import { useMcpSettings } from "@/features/assistant/hooks/use-mcp-settings";

type ChatHelpers = ReturnType<typeof useChat>;

interface ChatContextValue extends ChatHelpers {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  clearMessages: () => void;
  conversations: ReturnType<typeof useChatHistory>["conversations"];
  currentConversationId: string | null;
  loadConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearAllConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const { selectedServers, enabledTools } = useMcpSettings();
  const chatHistory = useChatHistory();

  const transport = useChatTransport({
    selectedModel,
    selectedServers,
    enabledTools,
  });

  const chatHelpers = useChat({ transport });

  const { isLoadingConversation } = useChatPersistence({
    chatHistory,
    messages: chatHelpers.messages,
    status: chatHelpers.status,
    setMessages: chatHelpers.setMessages,
    selectedModel,
    setSelectedModel,
    selectedServers,
  });

  const clearMessages = () => {
    chatHelpers.setMessages([]);
    chatHistory
      .startNewConversation(selectedModel, Array.from(selectedServers))
      .catch((error) => {
        console.error(
          "[ChatProvider] Failed to start new conversation:",
          error,
        );
      });
  };

  const handleLoadConversation = async (conversationId: string) => {
    isLoadingConversation.current = true;
    try {
      const messages = await chatHistory.loadConversation(conversationId);
      chatHelpers.setMessages(messages);

      const conv = chatHistory.conversations.find(
        (c) => c.id === conversationId,
      );
      if (conv?.model) {
        setSelectedModel(conv.model);
      }
    } catch (error) {
      isLoadingConversation.current = false;
      throw error;
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await chatHistory.deleteConversation(conversationId);
    if (conversationId === chatHistory.currentConversationId) {
      chatHelpers.setMessages([]);
    }
  };

  const handleClearAll = async () => {
    await chatHistory.clearAll();
    chatHelpers.setMessages([]);
  };

  const value: ChatContextValue = {
    ...chatHelpers,
    selectedModel,
    setSelectedModel,
    clearMessages,
    conversations: chatHistory.conversations,
    currentConversationId: chatHistory.currentConversationId,
    loadConversation: handleLoadConversation,
    deleteConversation: handleDeleteConversation,
    clearAllConversations: handleClearAll,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
