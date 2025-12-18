"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import type { V0ServerJson } from "@/generated/types.gen";
import { getServers } from "../catalog/actions";

export default function AssistantPage() {
  const [servers, setServers] = useState<V0ServerJson[]>([]);

  useEffect(() => {
    getServers().then(setServers).catch(console.error);
  }, []);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
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
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex-1 overflow-hidden">
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
    </div>
  );
}
