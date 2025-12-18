import type { ChatStatus, UIMessage } from "ai";
import { MessageSquare } from "lucide-react";
import { ChatMessage } from "./message/chat-message";

interface ChatMessagesProps {
  messages: UIMessage[];
  status: ChatStatus;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({
  messages,
  status,
  isLoading,
  messagesEndRef,
  messagesContainerRef,
}: ChatMessagesProps) {
  return (
    <div
      ref={messagesContainerRef}
      className="h-full w-full overflow-y-auto scroll-smooth"
    >
      <div className="space-y-6 p-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
            style={{
              animationDelay: `${Math.min(index * 50, 200)}ms`,
              animationFillMode: "both",
            }}
          >
            <ChatMessage status={status} message={message} />
          </div>
        ))}
        {isLoading && (
          <div className="animate-in fade-in-0 flex items-start gap-4 duration-500">
            <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg">
              <MessageSquare className="size-4" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="bg-muted-foreground size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
                  <div className="bg-muted-foreground size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
                  <div className="bg-muted-foreground size-1.5 animate-bounce rounded-full" />
                </div>
                <span className="text-muted-foreground text-sm">
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
