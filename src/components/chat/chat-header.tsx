"use client";

import { Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "../ui/button";

interface ChatHeaderProps {
  hasMessages: boolean;
  onClearMessages?: () => void;
}

export function ChatHeader({ hasMessages, onClearMessages }: ChatHeaderProps) {
  const { confirm, ConfirmDialog } = useConfirm();

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

  return (
    <>
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h1 className="text-2xl font-bold">Assistant</h1>
          <p className="text-muted-foreground text-sm">
            Chat with AI using MCP servers
          </p>
        </div>
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
