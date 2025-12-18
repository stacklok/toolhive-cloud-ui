"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { V0ServerJson } from "@/generated/types.gen";

export interface ToolInfo {
  name: string;
  description?: string;
  enabled: boolean;
}

export interface McpServerWithTools {
  server: V0ServerJson;
  tools: ToolInfo[];
  isSelected: boolean;
}

interface McpSettingsContextValue {
  /** Available servers from catalog */
  availableServers: V0ServerJson[];
  /** Set available servers (called by parent) */
  setAvailableServers: (servers: V0ServerJson[]) => void;
  /** Map of server name -> selected state */
  selectedServers: Set<string>;
  /** Toggle server selection */
  toggleServer: (serverName: string) => void;
  /** Select all servers */
  selectAllServers: () => void;
  /** Deselect all servers */
  deselectAllServers: () => void;
  /** Map of server name -> tool names that are enabled */
  enabledTools: Map<string, Set<string>>;
  /** Map of server name -> available tools */
  serverTools: Map<string, ToolInfo[]>;
  /** Set tools for a server (called after connecting) */
  setServerTools: (serverName: string, tools: ToolInfo[]) => void;
  /** Toggle a specific tool */
  toggleTool: (serverName: string, toolName: string) => void;
  /** Enable all tools for a server */
  enableAllTools: (serverName: string) => void;
  /** Disable all tools for a server */
  disableAllTools: (serverName: string) => void;
  /** Get enabled tool names for selected servers (for API call) */
  getEnabledToolsForRequest: () => { serverName: string; tools: string[] }[];
  /** Total enabled tools count */
  totalEnabledToolsCount: number;
  /** Total selected servers count */
  selectedServersCount: number;
}

const McpSettingsContext = createContext<McpSettingsContextValue | null>(null);

interface McpSettingsProviderProps {
  children: ReactNode;
  initialServers?: V0ServerJson[];
}

export function McpSettingsProvider({
  children,
  initialServers = [],
}: McpSettingsProviderProps) {
  const [availableServers, setAvailableServers] =
    useState<V0ServerJson[]>(initialServers);
  const [selectedServers, setSelectedServers] = useState<Set<string>>(
    () =>
      new Set(initialServers.map((s) => s.name).filter(Boolean) as string[]),
  );
  const [enabledTools, setEnabledTools] = useState<Map<string, Set<string>>>(
    () => new Map(),
  );
  const [serverTools, setServerToolsMap] = useState<Map<string, ToolInfo[]>>(
    () => new Map(),
  );

  const toggleServer = useCallback((serverName: string) => {
    setSelectedServers((prev) => {
      const next = new Set(prev);
      if (next.has(serverName)) {
        next.delete(serverName);
      } else {
        next.add(serverName);
      }
      return next;
    });
  }, []);

  const selectAllServers = useCallback(() => {
    setSelectedServers(
      new Set(availableServers.map((s) => s.name).filter(Boolean) as string[]),
    );
  }, [availableServers]);

  const deselectAllServers = useCallback(() => {
    setSelectedServers(new Set());
  }, []);

  const setServerTools = useCallback(
    (serverName: string, tools: ToolInfo[]) => {
      setServerToolsMap((prev) => {
        const next = new Map(prev);
        next.set(serverName, tools);
        return next;
      });

      // Initialize enabled tools (all enabled by default)
      setEnabledTools((prev) => {
        if (prev.has(serverName)) return prev; // Don't overwrite existing
        const next = new Map(prev);
        next.set(
          serverName,
          new Set(tools.filter((t) => t.enabled).map((t) => t.name)),
        );
        return next;
      });
    },
    [],
  );

  const toggleTool = useCallback((serverName: string, toolName: string) => {
    setEnabledTools((prev) => {
      const next = new Map(prev);
      const serverSet = new Set(prev.get(serverName) ?? []);
      if (serverSet.has(toolName)) {
        serverSet.delete(toolName);
      } else {
        serverSet.add(toolName);
      }
      next.set(serverName, serverSet);
      return next;
    });
  }, []);

  const enableAllTools = useCallback(
    (serverName: string) => {
      const tools = serverTools.get(serverName) ?? [];
      setEnabledTools((prev) => {
        const next = new Map(prev);
        next.set(serverName, new Set(tools.map((t) => t.name)));
        return next;
      });
    },
    [serverTools],
  );

  const disableAllTools = useCallback((serverName: string) => {
    setEnabledTools((prev) => {
      const next = new Map(prev);
      next.set(serverName, new Set());
      return next;
    });
  }, []);

  const getEnabledToolsForRequest = useCallback(() => {
    const result: { serverName: string; tools: string[] }[] = [];
    for (const serverName of selectedServers) {
      const tools = enabledTools.get(serverName);
      if (tools && tools.size > 0) {
        result.push({ serverName, tools: Array.from(tools) });
      }
    }
    return result;
  }, [selectedServers, enabledTools]);

  const totalEnabledToolsCount = useMemo(() => {
    let count = 0;
    for (const serverName of selectedServers) {
      count += enabledTools.get(serverName)?.size ?? 0;
    }
    return count;
  }, [selectedServers, enabledTools]);

  const selectedServersCount = selectedServers.size;

  const value: McpSettingsContextValue = useMemo(
    () => ({
      availableServers,
      setAvailableServers,
      selectedServers,
      toggleServer,
      selectAllServers,
      deselectAllServers,
      enabledTools,
      serverTools,
      setServerTools,
      toggleTool,
      enableAllTools,
      disableAllTools,
      getEnabledToolsForRequest,
      totalEnabledToolsCount,
      selectedServersCount,
    }),
    [
      availableServers,
      selectedServers,
      toggleServer,
      selectAllServers,
      deselectAllServers,
      enabledTools,
      serverTools,
      setServerTools,
      toggleTool,
      enableAllTools,
      disableAllTools,
      getEnabledToolsForRequest,
      totalEnabledToolsCount,
      selectedServersCount,
    ],
  );

  return (
    <McpSettingsContext.Provider value={value}>
      {children}
    </McpSettingsContext.Provider>
  );
}

export function useMcpSettings(): McpSettingsContextValue {
  const context = useContext(McpSettingsContext);
  if (!context) {
    throw new Error("useMcpSettings must be used within McpSettingsProvider");
  }
  return context;
}
