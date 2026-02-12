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
  onClearAll: () => Promise<void>;
  hasMessages: boolean;
}

export function ChatHeader({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onClearAll,
  hasMessages,
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

  const handleClearAll = async () => {
    const confirmed = await confirm({
      title: "Clear all conversations?",
      description:
        "This will permanently delete all conversations and messages.",
      confirmText: "Clear All",
      cancelText: "Cancel",
    });
    if (confirmed) {
      await onClearAll();
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full">
              <span className="text-sm font-medium">Chat history</span>
              <ChevronDown className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0">
            <ConversationList
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={onSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              onClearAll={handleClearAll}
              onClose={() => setIsOpen(false)}
            />
          </PopoverContent>
        </Popover>

        <Button
          onClick={handleNewConversation}
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={!hasMessages}
        >
          <Plus className="mr-1 size-4" />
          New conversation
        </Button>
      </div>
      {ConfirmDialog}
    </>
  );
}
