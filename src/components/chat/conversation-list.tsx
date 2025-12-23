"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StoredConversation } from "@/features/assistant/db";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: StoredConversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  onClose?: () => void;
}

export function ConversationList({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
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

  const handleNewConversation = () => {
    onNewConversation();
    onClose?.();
  };

  return (
    <div className="flex w-72 flex-col">
      {/* Search input */}
      <div className="border-b p-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* New conversation button */}
      <div className="border-b p-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleNewConversation}
        >
          <Plus className="mr-2 h-4 w-4" />
          New conversation
        </Button>
      </div>

      {/* Conversations list */}
      <ScrollArea className="max-h-80">
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
      </ScrollArea>
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
        "group grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-md p-2 transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 items-center gap-2 text-left"
      >
        <MessageSquare className="text-muted-foreground h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-muted-foreground truncate text-xs">{timeAgo}</p>
        </div>
      </button>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground h-6 w-6 shrink-0 rounded p-1 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
