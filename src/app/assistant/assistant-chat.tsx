"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useRef, useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { DEFAULT_MODEL } from "./constants";

export function AssistantChat() {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  // Use ref to access current model in the transport callback
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  // Create transport with prepareSendMessagesRequest to inject model dynamically
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body, ...rest }) => {
          return {
            ...rest,
            body: {
              messages,
              ...body,
              model: selectedModelRef.current,
            },
          };
        },
      }),
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

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  return (
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
      selectedModel={selectedModel}
      onModelChange={handleModelChange}
    />
  );
}
