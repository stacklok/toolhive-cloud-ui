"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import type { StoredConversation } from "@/features/assistant/db";
import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ConversationList } from "./conversation-list";

interface ChatHeaderProps {
  conversations: StoredConversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ChatHeader({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
}: ChatHeaderProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [isOpen, setIsOpen] = useState(false);

  const handleNewConversation = () => {
    onNewConversation();
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
            <Button variant="ghost" className="h-auto gap-2 p-1">
              <span className="text-2xl font-bold">Assistant</span>
              <ChevronDown className="text-muted-foreground size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0">
            <ConversationList
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={onSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              onClose={() => setIsOpen(false)}
            />
          </PopoverContent>
        </Popover>

        <p className="text-muted-foreground flex-1 pl-2 text-sm">
          Chat with AI using MCP servers
        </p>

        <Button
          onClick={handleNewConversation}
          variant="secondary"
          size="sm"
          className="cursor-pointer"
        >
          <Plus className="mr-2 size-4" />
          New Conversation
        </Button>
      </div>
      {ConfirmDialog}
    </>
  );
}
