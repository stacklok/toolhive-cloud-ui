"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";
import type { useChatHistory } from "./use-chat-history";

type ChatHistory = ReturnType<typeof useChatHistory>;

interface UseChatPersistenceOptions {
  chatHistory: ChatHistory;
  messages: UIMessage[];
  status: string;
  setMessages: (messages: UIMessage[]) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedServers: Set<string>;
}

interface UseChatPersistenceResult {
  isLoadingConversation: React.RefObject<boolean>;
}

/**
 * Handles chat persistence: auto-loading last conversation on mount
 * and auto-saving messages when streaming completes.
 */
export function useChatPersistence({
  chatHistory,
  messages,
  status,
  setMessages,
  selectedModel,
  setSelectedModel,
  selectedServers,
}: UseChatPersistenceOptions): UseChatPersistenceResult {
  const hasLoadedInitialConversation = useRef(false);
  const isLoadingConversationRef = useRef(false);
  const previousStatusRef = useRef(status);

  // Auto-load last conversation on mount
  useEffect(() => {
    if (chatHistory.isLoading || hasLoadedInitialConversation.current) {
      return;
    }

    if (messages.length > 0) {
      hasLoadedInitialConversation.current = true;
      return;
    }

    if (chatHistory.conversations.length > 0) {
      const lastConversation = chatHistory.conversations[0];
      isLoadingConversationRef.current = true;

      chatHistory
        .loadConversation(lastConversation.id)
        .then((loadedMessages) => {
          if (loadedMessages.length > 0) {
            setMessages(loadedMessages);
            if (lastConversation.model) {
              setSelectedModel(lastConversation.model);
            }
          }
        })
        .catch((error) => {
          console.error("[useChatPersistence] Failed to load:", error);
        })
        .finally(() => {
          isLoadingConversationRef.current = false;
        });
    }

    hasLoadedInitialConversation.current = true;
  }, [
    chatHistory.isLoading,
    chatHistory.conversations,
    chatHistory.loadConversation,
    messages.length,
    setMessages,
    setSelectedModel,
  ]);

  // Save when streaming completes (status changes from "streaming" to "ready")
  useEffect(() => {
    const wasStreaming = previousStatusRef.current === "streaming";
    const isNowReady = status === "ready";
    previousStatusRef.current = status;

    if (!wasStreaming || !isNowReady) {
      return;
    }

    if (messages.length === 0 || isLoadingConversationRef.current) {
      return;
    }

    const serversArray = Array.from(selectedServers);
    chatHistory
      .saveCurrentMessages(messages, selectedModel, serversArray)
      .catch((error) => {
        console.error("[useChatPersistence] Failed to save:", error);
      });
  }, [status, messages, selectedModel, selectedServers, chatHistory]);

  return {
    isLoadingConversation: isLoadingConversationRef,
  };
}
