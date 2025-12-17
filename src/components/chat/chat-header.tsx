import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";

interface ChatHeaderProps {
  hasMessages: boolean;
  onClearMessages?: () => void;
}

export function ChatHeader({ hasMessages, onClearMessages }: ChatHeaderProps) {
  const handleClearMessages = () => {
    if (!onClearMessages) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete all messages?",
    );
    if (confirmed) {
      onClearMessages();
    }
  };

  return (
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
  );
}
