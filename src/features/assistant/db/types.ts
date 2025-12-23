import type { UIMessage } from "ai";

/**
 * Stored conversation metadata.
 */
export interface StoredConversation {
  id: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  model?: string;
  selectedServers?: string[];
}

/**
 * Stored message with reference to conversation.
 */
export interface StoredMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  parts: UIMessage["parts"];
  metadata?: UIMessage["metadata"];
  createdAt: number;
  order: number;
}
