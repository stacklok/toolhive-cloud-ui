"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useMemo } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function AssistantPage() {
  const transport = useMemo(
    () => new TextStreamChatTransport({ api: "/api/chat" }),
    [],
  );

  const {
    messages,
    sendMessage,
    status,
    clearError,
    stop,
    error,
    setMessages,
  } = useChat({
    transport,
  });

  const handleClearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatInterface
        messages={messages}
        status={status}
        error={error}
        cancelRequest={async () => {
          await stop();
          clearError();
        }}
        onClearMessages={handleClearMessages}
        sendMessage={sendMessage}
      />
    </div>
  );
}
