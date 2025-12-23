"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Search, Trash, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StoredConversation } from "@/features/assistant/db";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: StoredConversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
  onClose?: () => void;
}

export function ConversationList({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onClearAll,
  onClose,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.title?.toLowerCase().includes(query) ||
        conv.model?.toLowerCase().includes(query),
    );
  }, [conversations, searchQuery]);

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    onClose?.();
  };

  return (
    <div className="flex w-72 flex-col overflow-hidden">
      <div className="border-b p-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-muted-foreground p-4 text-center text-sm">
            {searchQuery ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          <div className="space-y-1 p-1">
            {filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === currentConversationId}
                onSelect={() => handleSelect(conv.id)}
                onDelete={() => onDeleteConversation(conv.id)}
              />
            ))}
          </div>
        )}
      </div>

      {conversations.length > 0 && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-destructive w-full justify-start"
            onClick={onClearAll}
          >
            <Trash className="mr-2 size-4" />
            Clear all messages
          </Button>
        </div>
      )}
    </div>
  );
}

interface ConversationItemProps {
  conversation: StoredConversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  const title = conversation.title || "New conversation";
  const timeAgo = formatDistanceToNow(new Date(conversation.updatedAt), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        "group flex w-full items-center gap-2 rounded-md px-2 py-2 transition-colors",
        "hover:bg-accent",
        isActive && "bg-accent",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <MessageSquare className="text-muted-foreground size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-muted-foreground truncate text-xs">{timeAgo}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-muted-foreground hover:text-destructive shrink-0 rounded p-1"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
