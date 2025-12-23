"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEFAULT_MODEL } from "@/features/assistant/constants";
import { useChatHistory } from "@/features/assistant/hooks/use-chat-history";
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
  const chatHistory = useChatHistory();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Auto-save messages to IndexedDB with debouncing
  useEffect(() => {
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Skip if no messages or still streaming
    if (
      chatHelpers.messages.length === 0 ||
      chatHelpers.status === "streaming"
    ) {
      return;
    }

    // Debounce save to avoid too many writes during rapid updates
    saveTimeoutRef.current = setTimeout(() => {
      const serversArray = Array.from(selectedServers);
      chatHistory
        .saveCurrentMessages(chatHelpers.messages, selectedModel, serversArray)
        .catch((error) => {
          console.error("[ChatProvider] Failed to save messages:", error);
        });
    }, 500); // Wait 500ms after last change

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    chatHelpers.messages,
    chatHelpers.status,
    selectedModel,
    selectedServers,
    chatHistory,
  ]);

  const clearMessages = () => {
    chatHelpers.setMessages([]);
    chatHistory.clearCurrentConversation();
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
