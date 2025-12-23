"use client";

import { DefaultChatTransport } from "ai";
import { useMemo, useRef } from "react";

interface UseChatTransportOptions {
  selectedModel: string;
  selectedServers: Set<string>;
  enabledTools: Map<string, Set<string>>;
}

/**
 * Creates a chat transport that dynamically injects model, servers, and tools
 * into each request without recreating the transport on every change.
 */
export function useChatTransport({
  selectedModel,
  selectedServers,
  enabledTools,
}: UseChatTransportOptions) {
  // Use refs to access current values in the transport callback
  // This avoids recreating the transport when these values change
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  const selectedServersRef = useRef(selectedServers);
  selectedServersRef.current = selectedServers;

  const enabledToolsRef = useRef(enabledTools);
  enabledToolsRef.current = enabledTools;

  return useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body, ...rest }) => {
          const serversArray = Array.from(selectedServersRef.current);

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
}
