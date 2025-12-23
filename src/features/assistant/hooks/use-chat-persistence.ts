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
  /** Whether we're currently loading a conversation (skip auto-save) */
  isLoadingConversation: React.RefObject<boolean>;
}

/**
 * Handles chat persistence: auto-loading last conversation on mount
 * and auto-saving messages to IndexedDB with debouncing.
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedInitialConversation = useRef(false);
  const isLoadingConversationRef = useRef(false);

  // Auto-load last conversation on mount
  useEffect(() => {
    async function loadLastConversation() {
      if (chatHistory.isLoading) {
        return;
      }

      if (hasLoadedInitialConversation.current) {
        return;
      }

      if (messages.length > 0) {
        hasLoadedInitialConversation.current = true;
        return;
      }

      if (chatHistory.conversations.length > 0) {
        const lastConversation = chatHistory.conversations[0];
        try {
          isLoadingConversationRef.current = true;
          const loadedMessages = await chatHistory.loadConversation(
            lastConversation.id,
          );
          if (loadedMessages.length > 0) {
            setMessages(loadedMessages);
            if (lastConversation.model) {
              setSelectedModel(lastConversation.model);
            }
          }
        } catch (error) {
          isLoadingConversationRef.current = false;
          console.error(
            "[useChatPersistence] Failed to load last conversation:",
            error,
          );
        }
      }

      hasLoadedInitialConversation.current = true;
    }

    loadLastConversation();
  }, [
    chatHistory.isLoading,
    chatHistory.conversations,
    chatHistory.loadConversation,
    messages.length,
    setMessages,
    setSelectedModel,
  ]);

  // Auto-save messages with debouncing
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Skip if loading a conversation (avoid updating timestamp on load)
    if (isLoadingConversationRef.current) {
      isLoadingConversationRef.current = false;
      return;
    }

    // Skip if no messages or still streaming
    if (messages.length === 0 || status === "streaming") {
      return;
    }

    saveTimeoutRef.current = setTimeout(() => {
      const serversArray = Array.from(selectedServers);
      chatHistory
        .saveCurrentMessages(messages, selectedModel, serversArray)
        .catch((error) => {
          console.error("[useChatPersistence] Failed to save messages:", error);
        });
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, status, selectedModel, selectedServers, chatHistory]);

  return {
    isLoadingConversation: isLoadingConversationRef,
  };
}
