import type { UIMessage } from "ai";
import { db } from "./database";
import type { StoredConversation, StoredMessage } from "./types";

/**
 * Creates a new conversation and returns its ID.
 */
export async function createConversation(
  title?: string,
  model?: string,
  selectedServers?: string[],
): Promise<string> {
  const id = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();

  await db.conversations.add({
    id,
    title,
    createdAt: now,
    updatedAt: now,
    model,
    selectedServers,
  });

  return id;
}

/**
 * Gets all conversations ordered by most recent first.
 */
export async function getAllConversations(): Promise<StoredConversation[]> {
  return db.conversations.orderBy("updatedAt").reverse().toArray();
}

/**
 * Gets a conversation by ID.
 */
export async function getConversation(
  id: string,
): Promise<StoredConversation | undefined> {
  return db.conversations.get(id);
}

/**
 * Updates conversation metadata.
 */
export async function updateConversation(
  id: string,
  updates: Partial<
    Pick<StoredConversation, "title" | "model" | "selectedServers">
  >,
): Promise<void> {
  await db.conversations.update(id, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Deletes a conversation and all its messages.
 */
export async function deleteConversation(id: string): Promise<void> {
  await db.transaction("rw", db.conversations, db.messages, async () => {
    await db.messages.where("conversationId").equals(id).delete();
    await db.conversations.delete(id);
  });
}

/**
 * Saves a message to the database.
 * Only saves user and assistant messages (filters out system messages).
 */
export async function saveMessage(
  conversationId: string,
  message: UIMessage,
  order: number,
): Promise<void> {
  // Skip system messages - they're not visible in the UI
  if (message.role === "system") {
    return;
  }

  const createdAt =
    (message.metadata as { createdAt?: number } | undefined)?.createdAt ??
    Date.now();

  await db.messages.add({
    id: message.id,
    conversationId,
    role: message.role as "user" | "assistant",
    parts: message.parts,
    metadata: message.metadata,
    createdAt,
    order,
  });

  // Update conversation updatedAt timestamp
  await db.conversations.update(conversationId, {
    updatedAt: Date.now(),
  });
}

/**
 * Saves multiple messages in bulk (more efficient).
 * Only saves user and assistant messages (filters out system messages).
 */
export async function saveMessages(
  conversationId: string,
  messages: UIMessage[],
): Promise<void> {
  const now = Date.now();
  let order = 0;
  const storedMessages: StoredMessage[] = [];

  for (const message of messages) {
    // Skip system messages - they're not visible in the UI
    if (message.role === "system") {
      continue;
    }

    const createdAt =
      (message.metadata as { createdAt?: number } | undefined)?.createdAt ??
      now;

    storedMessages.push({
      id: message.id,
      conversationId,
      role: message.role as "user" | "assistant",
      parts: message.parts,
      metadata: message.metadata,
      createdAt,
      order,
    });

    order++;
  }

  await db.transaction("rw", db.messages, db.conversations, async () => {
    // Delete existing messages for this conversation
    await db.messages.where("conversationId").equals(conversationId).delete();
    // Add new messages
    await db.messages.bulkAdd(storedMessages);
    // Update conversation timestamp
    await db.conversations.update(conversationId, {
      updatedAt: Date.now(),
    });
  });
}

/**
 * Gets all messages for a conversation, ordered by creation order.
 */
export async function getMessages(
  conversationId: string,
): Promise<StoredMessage[]> {
  return db.messages
    .where("conversationId")
    .equals(conversationId)
    .sortBy("order");
}

/**
 * Converts stored messages back to UIMessage format.
 */
export function storedMessagesToUIMessages(
  stored: StoredMessage[],
): UIMessage[] {
  return stored.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: msg.parts,
    metadata: msg.metadata,
  }));
}

/**
 * Deletes all messages for a conversation.
 */
export async function deleteMessages(conversationId: string): Promise<void> {
  await db.messages.where("conversationId").equals(conversationId).delete();
}
