"use client";

import type { ChatStatus, FileUIPart, UIMessage } from "ai";
import {
  ChevronDown,
  MessageCircleMore,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChatInputPrompt } from "./chat-input";
import { ChatMessage } from "./chat-message";
import { ErrorAlert } from "./error-alert";

interface ChatInterfaceProps {
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onClearMessages?: () => void;
  sendMessage: (args: { text: string; files?: FileUIPart[] }) => Promise<void>;
}

export function ChatInterface({
  messages,
  status,
  error,
  input,
  onInputChange,
  onSubmit,
  onStop,
  onClearMessages,
  sendMessage,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const isLoading = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  const checkScrollPosition = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) {
      setShowScrollToBottom(false);
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom <= 10;

    setShowScrollToBottom(!isAtBottom);
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll to bottom when messages change
  const messagesLength = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll when message count changes
  useLayoutEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    setTimeout(checkScrollPosition, 200);
  }, [messagesLength, checkScrollPosition]);

  // Add scroll listener
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScrollPosition);
    return () => container.removeEventListener("scroll", checkScrollPosition);
  }, [checkScrollPosition]);

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
    <div className="flex h-full flex-col">
      {/* Header */}
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

      {hasMessages && <Separator />}

      {/* Messages Area */}
      <div className="relative flex-1 overflow-hidden">
        {hasMessages ? (
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
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="animate-in fade-in-0 flex items-start gap-4 duration-500">
                  <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="bg-muted-foreground h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
                        <div className="bg-muted-foreground h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
                        <div className="bg-muted-foreground h-1.5 w-1.5 animate-bounce rounded-full" />
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
        ) : (
          <div className="flex h-full items-center justify-center px-6">
            <div className="w-full max-w-2xl space-y-8 text-center">
              <div>
                <MessageCircleMore
                  strokeWidth={1}
                  size={80}
                  className="text-muted-foreground mx-auto mb-4 scale-x-[-1]"
                />
                <h2 className="text-foreground text-2xl font-bold">
                  Test & evaluate your MCP Servers
                </h2>
                <p className="text-muted-foreground mt-2">
                  Send a message to start chatting with the AI assistant
                </p>
              </div>

              {/* Chat Input in empty state */}
              <div className="mx-auto max-w-xl">
                <ChatInputPrompt
                  onStopGeneration={() => {}}
                  hasProviderAndModel={true}
                  status={status}
                  onSendMessage={sendMessage}
                />
              </div>
            </div>
          </div>
        )}

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <Button
            size="sm"
            variant="secondary"
            className="animate-in fade-in-0 slide-in-from-bottom-2 absolute bottom-4 left-1/2 z-50 h-10 w-10 -translate-x-1/2 cursor-pointer rounded-full p-0 duration-200"
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Error Alert */}
      <ErrorAlert error={error?.message ?? null} />

      {/* Chat Input when there are messages */}
      {/* {hasMessages && ( */}
      {/*   <div className="border-t p-4"> */}
      {/*     <ChatInput */}
      {/*       value={input} */}
      {/*       onChange={onInputChange} */}
      {/*       onSubmit={onSubmit} */}
      {/*       onStop={onStop} */}
      {/*       status={status} */}
      {/*     /> */}
      {/*   </div> */}
      {/* )} */}
    </div>
  );
}
