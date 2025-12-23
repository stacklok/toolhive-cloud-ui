import Dexie, { type EntityTable } from "dexie";
import type { StoredConversation, StoredMessage } from "./types";

/**
 * Chat database schema using Dexie.
 */
class ChatDatabase extends Dexie {
  conversations!: EntityTable<StoredConversation, "id">;
  messages!: EntityTable<StoredMessage, "id">;

  constructor() {
    super("ToolHiveChatDB");

    this.version(1).stores({
      conversations: "id, createdAt, updatedAt",
      messages: "id, conversationId, createdAt, order, [conversationId+order]",
    });
  }
}

export const db = new ChatDatabase();
