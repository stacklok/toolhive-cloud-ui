"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useMemo, useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function AssistantPage() {
  const transport = useMemo(
    () => new TextStreamChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    transport,
  });

  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatInterface
        messages={messages}
        status={status}
        error={error}
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onStop={stop}
        onClearMessages={handleClearMessages}
        sendMessage={sendMessage}
      />
    </div>
  );
}
