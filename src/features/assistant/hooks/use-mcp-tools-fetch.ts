"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMcpServerTools } from "@/features/assistant/actions/mcp-actions";
import { useMcpSettings } from "./use-mcp-settings";

/**
 * Hook for fetching MCP server tools with deduplication.
 * Handles React Strict Mode double-render by using a ref to track in-flight requests.
 */
export function useMcpToolsFetch() {
  const { selectedServers, serverTools, setServerTools } = useMcpSettings();

  const [loadingServers, setLoadingServers] = useState<Set<string>>(new Set());

  // Ref to track in-flight requests - persists across Strict Mode double renders
  const loadingRef = useRef<Set<string>>(new Set());

  const fetchToolsForServer = useCallback(
    async (serverName: string) => {
      // Skip if already have tools or already loading (ref check prevents Strict Mode duplicates)
      if (serverTools.has(serverName) || loadingRef.current.has(serverName)) {
        return;
      }

      loadingRef.current.add(serverName);
      setLoadingServers((prev) => new Set(prev).add(serverName));

      try {
        const response = await getMcpServerTools(serverName);
        if (response.tools.length > 0) {
          setServerTools(serverName, response.tools);
        }
      } catch (error) {
        // Ignore AbortError - happens during Strict Mode re-renders
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error(`Failed to fetch tools for ${serverName}:`, error);
      } finally {
        loadingRef.current.delete(serverName);
        setLoadingServers((prev) => {
          const next = new Set(prev);
          next.delete(serverName);
          return next;
        });
      }
    },
    [serverTools, setServerTools],
  );

  // Fetch tools for all selected servers on mount and when selection changes
  useEffect(() => {
    for (const serverName of selectedServers) {
      if (!serverTools.has(serverName)) {
        fetchToolsForServer(serverName);
      }
    }
  }, [selectedServers, serverTools, fetchToolsForServer]);

  const isLoading = (serverName: string): boolean => {
    return loadingServers.has(serverName);
  };

  return {
    loadingServers,
    isLoading,
    fetchToolsForServer,
  };
}
