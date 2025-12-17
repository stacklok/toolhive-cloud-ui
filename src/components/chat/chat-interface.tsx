"use client";

import type { ChatStatus, FileUIPart, UIMessage } from "ai";
import { ChevronDown } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatHeader } from "./chat-header";
import { ChatInputPrompt } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { ErrorAlert } from "./error-alert";

interface ChatInterfaceProps {
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
  cancelRequest: () => void;
  onClearMessages?: () => void;
  sendMessage: (args: { text: string; files?: FileUIPart[] }) => Promise<void>;
}

export function ChatInterface({
  messages,
  status,
  error,
  cancelRequest,
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
    <div className="flex h-full flex-col px-8">
      <ChatHeader
        hasMessages={hasMessages}
        onClearMessages={handleClearMessages}
      />

      {hasMessages && <Separator />}

      <div className="relative flex-1 overflow-hidden">
        {hasMessages ? (
          <ChatMessages
            messages={messages}
            status={status}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
            messagesContainerRef={messagesContainerRef}
          />
        ) : (
          <ChatEmptyState
            status={status}
            onSendMessage={sendMessage}
            onStopGeneration={cancelRequest}
          />
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

      {hasMessages && (
        <div className="w-full">
          <ChatInputPrompt
            onStopGeneration={cancelRequest}
            hasProviderAndModel={true}
            status={status}
            onSendMessage={sendMessage}
          />
        </div>
      )}
    </div>
  );
}
