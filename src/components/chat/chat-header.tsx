"use client";

import { ChevronDown, Trash2 } from "lucide-react";
import { useState } from "react";
import type { StoredConversation } from "@/features/assistant/db";
import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ConversationList } from "./conversation-list";

interface ChatHeaderProps {
  hasMessages: boolean;
  onClearMessages?: () => void;
  conversations: StoredConversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ChatHeader({
  hasMessages,
  onClearMessages,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
}: ChatHeaderProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [isOpen, setIsOpen] = useState(false);

  const handleClearMessages = async () => {
    if (!onClearMessages) return;
    const confirmed = await confirm({
      title: "Clear all messages?",
      description: "Are you sure you want to delete all messages?",
      confirmText: "Clear",
      cancelText: "Cancel",
    });
    if (confirmed) {
      onClearMessages();
    }
  };

  const handleDeleteConversation = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete conversation?",
      description: "This will permanently delete this conversation.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (confirmed) {
      onDeleteConversation(id);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b p-4">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="hover:bg-accent flex items-center gap-1 rounded-md p-1 transition-colors"
            >
              <h1 className="text-2xl font-bold">Assistant</h1>
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0">
            <ConversationList
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={onSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              onNewConversation={onNewConversation}
              onClose={() => setIsOpen(false)}
            />
          </PopoverContent>
        </Popover>

        <p className="text-muted-foreground flex-1 pl-2 text-sm">
          Chat with AI using MCP servers
        </p>

        {hasMessages && onClearMessages && (
          <Button
            onClick={handleClearMessages}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Chat
          </Button>
        )}
      </div>
      {ConfirmDialog}
    </>
  );
}
