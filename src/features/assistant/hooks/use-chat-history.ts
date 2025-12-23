"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import {
  createConversation,
  deleteAllConversations,
  deleteConversation,
  getAllConversations,
  getConversation,
  getMessages,
  type StoredConversation,
  saveMessages,
  storedMessagesToUIMessages,
  updateConversation,
} from "../db";

/**
 * Extracts title from the first user message.
 */
function extractTitleFromMessages(messages: UIMessage[]): string | null {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) return null;

  const textContent = firstUserMessage.parts
    .filter((p) => p.type === "text")
    .map((p) => ("text" in p ? p.text : ""))
    .join("")
    .trim()
    .slice(0, 100);

  return textContent || null;
}

/**
 * Hook for managing chat history with Dexie.
 * Handles conversation creation, loading, and automatic message saving.
 */
export function useChatHistory() {
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    async function loadConversations() {
      try {
        const allConversations = await getAllConversations();
        setConversations(allConversations);
      } catch (error) {
        console.error("[useChatHistory] Failed to load conversations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isInitializedRef.current) {
      loadConversations();
      isInitializedRef.current = true;
    }
  }, []);

  /**
   * Creates a new conversation and sets it as current.
   */
  const startNewConversation = async (
    model?: string,
    selectedServers?: string[],
  ): Promise<string> => {
    const id = await createConversation(undefined, model, selectedServers);
    setCurrentConversationId(id);
    await refreshConversations();
    return id;
  };

  /**
   * Loads a conversation and returns its messages.
   */
  const loadConversation = async (
    conversationId: string,
  ): Promise<UIMessage[]> => {
    const storedMessages = await getMessages(conversationId);
    const messages = storedMessagesToUIMessages(storedMessages);
    setCurrentConversationId(conversationId);
    return messages;
  };

  /**
   * Saves messages to the current conversation.
   * Creates a new conversation if none exists.
   */
  const saveCurrentMessages = async (
    messages: UIMessage[],
    model?: string,
    selectedServers?: string[],
  ): Promise<void> => {
    if (messages.length === 0) {
      return;
    }

    let conversationId = currentConversationId;

    if (!conversationId) {
      conversationId = await startNewConversation(model, selectedServers);
    }

    if (model || selectedServers) {
      await updateConversation(conversationId, { model, selectedServers });
    }

    await saveMessages(conversationId, messages);

    // Update title from first user message if not set
    const currentConv = await getConversation(conversationId);
    if (currentConv && !currentConv.title) {
      const title = extractTitleFromMessages(messages);
      if (title) {
        await updateConversation(conversationId, { title });
        await refreshConversations();
      }
    }
  };

  /**
   * Deletes a conversation.
   */
  const deleteConv = async (conversationId: string): Promise<void> => {
    await deleteConversation(conversationId);
    if (conversationId === currentConversationId) {
      setCurrentConversationId(null);
    }
    await refreshConversations();
  };

  /**
   * Refreshes the conversations list.
   */
  const refreshConversations = async (): Promise<void> => {
    const allConversations = await getAllConversations();
    setConversations(allConversations);
  };

  /**
   * Clears all conversations and messages.
   */
  const clearAll = async (): Promise<void> => {
    await deleteAllConversations();
    setCurrentConversationId(null);
    setConversations([]);
  };

  return {
    currentConversationId,
    conversations,
    isLoading,
    startNewConversation,
    loadConversation,
    saveCurrentMessages,
    deleteConversation: deleteConv,
    refreshConversations,
    clearAll,
  };
}
