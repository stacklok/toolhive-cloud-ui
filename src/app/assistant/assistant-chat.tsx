"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useRef, useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { DEFAULT_MODEL } from "./constants";
import { useMcpSettings } from "./hooks/use-mcp-settings";

export function AssistantChat() {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const { selectedServers, enabledTools } = useMcpSettings();

  // Use refs to access current values in the transport callback
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  const selectedServersRef = useRef(selectedServers);
  selectedServersRef.current = selectedServers;

  const enabledToolsRef = useRef(enabledTools);
  enabledToolsRef.current = enabledTools;

  // Create transport with prepareSendMessagesRequest to inject settings dynamically
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body, ...rest }) => {
          // Convert Set to array for selectedServers
          const serversArray = Array.from(selectedServersRef.current);

          // Convert Map<string, Set<string>> to Record<string, string[]>
          const toolsRecord: Record<string, string[]> = {};
          for (const [serverName, toolsSet] of enabledToolsRef.current) {
            toolsRecord[serverName] = Array.from(toolsSet);
          }

          return {
            ...rest,
            body: {
              messages,
              ...body,
              model: selectedModelRef.current,
              selectedServers: serversArray,
              enabledTools: toolsRecord,
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
