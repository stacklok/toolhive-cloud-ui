"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { createContext, useContext, useMemo, useRef, useState } from "react";
import { DEFAULT_MODEL } from "@/features/assistant/constants";
import { useMcpSettings } from "@/features/assistant/hooks/use-mcp-settings";

type ChatHelpers = ReturnType<typeof useChat>;

interface ChatContextValue extends ChatHelpers {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
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

  const chatHelpers = useChat({
    transport,
  });

  const clearMessages = () => {
    chatHelpers.setMessages([]);
  };

  const value: ChatContextValue = {
    ...chatHelpers,
    selectedModel,
    setSelectedModel,
    clearMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
