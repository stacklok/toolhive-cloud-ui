"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import type { MCPServerWithTools } from "@/features/vmcp-builder/types";
import type { VMCPConfig } from "../types";

/**
 * State of a server in the builder
 */
export interface BuilderServerState {
  server: MCPServerWithTools;
  selectedTools: string[];
}

/**
 * State of a workflow step
 */
export interface BuilderWorkflowStep {
  id: string;
  serverName: string;
  toolName: string;
}

/**
 * Complete state of the vMCP builder
 */
export interface VMCPBuilderState {
  /** Name of the vMCP being built */
  name: string;
  /** Description of the vMCP */
  description: string;
  /** Servers added to the builder with their selected tools */
  servers: BuilderServerState[];
  /** Workflow steps (for composite tools) */
  workflowSteps: BuilderWorkflowStep[];
  /** Generated YAML */
  yaml: string | null;
  /** Current tab: aggregation or workflows */
  activeTab: "aggregation" | "workflows" | "yaml";
}

/**
 * Actions available to modify the builder
 */
export interface VMCPBuilderActions {
  /** Set the vMCP name */
  setName: (name: string) => void;
  /** Set the vMCP description */
  setDescription: (description: string) => void;
  /** Add a server to the builder */
  addServer: (server: MCPServerWithTools, selectedTools?: string[]) => void;
  /** Remove a server from the builder */
  removeServer: (serverName: string) => void;
  /** Toggle a tool selection for a server */
  toggleTool: (serverName: string, toolName: string) => void;
  /** Select all tools for a server */
  selectAllTools: (serverName: string) => void;
  /** Deselect all tools for a server */
  deselectAllTools: (serverName: string) => void;
  /** Add a workflow step */
  addWorkflowStep: (serverName: string, toolName: string) => void;
  /** Remove a workflow step */
  removeWorkflowStep: (stepId: string) => void;
  /** Set the active tab */
  setActiveTab: (tab: "aggregation" | "workflows" | "yaml") => void;
  /** Update the YAML */
  setYaml: (yaml: string | null) => void;
  /** Reset the builder */
  reset: () => void;
  /** Get the current config as VMCPConfig */
  getConfig: () => VMCPConfig;
}

/**
 * Callback for builder changes
 */
export type OnBuilderChange = (
  state: VMCPBuilderState,
  action: string,
  details?: Record<string, unknown>,
) => void;

interface VMCPBuilderContextValue {
  state: VMCPBuilderState;
  actions: VMCPBuilderActions;
  /** Register a callback for when the builder state changes */
  onBuilderChange?: OnBuilderChange;
}

const initialState: VMCPBuilderState = {
  name: "my-vmcp",
  description: "",
  servers: [],
  workflowSteps: [],
  yaml: null,
  activeTab: "aggregation",
};

const VMCPBuilderContext = createContext<VMCPBuilderContextValue | null>(null);

interface VMCPBuilderProviderProps {
  children: ReactNode;
  initialConfig?: Partial<VMCPBuilderState>;
  onBuilderChange?: OnBuilderChange;
}

export function VMCPBuilderProvider({
  children,
  initialConfig,
  onBuilderChange,
}: VMCPBuilderProviderProps) {
  const [state, setState] = useState<VMCPBuilderState>({
    ...initialState,
    ...initialConfig,
  });

  const notifyChange = useCallback(
    (action: string, details?: Record<string, unknown>) => {
      if (onBuilderChange) {
        // Get updated state after the action
        setState((currentState) => {
          onBuilderChange(currentState, action, details);
          return currentState;
        });
      }
    },
    [onBuilderChange],
  );

  const actions: VMCPBuilderActions = {
    setName: useCallback(
      (name: string) => {
        setState((s) => ({ ...s, name }));
        notifyChange("setName", { name });
      },
      [notifyChange],
    ),

    setDescription: useCallback(
      (description: string) => {
        setState((s) => ({ ...s, description }));
        notifyChange("setDescription", { description });
      },
      [notifyChange],
    ),

    addServer: useCallback(
      (server: MCPServerWithTools, selectedTools?: string[]) => {
        setState((s) => {
          // Check if server already exists
          if (s.servers.some((srv) => srv.server.name === server.name)) {
            return s;
          }
          return {
            ...s,
            servers: [
              ...s.servers,
              {
                server,
                selectedTools: selectedTools ?? server.tools.map((t) => t.name),
              },
            ],
          };
        });
        notifyChange("addServer", {
          serverName: server.name,
          toolCount: server.tools.length,
        });
      },
      [notifyChange],
    ),

    removeServer: useCallback(
      (serverName: string) => {
        setState((s) => ({
          ...s,
          servers: s.servers.filter((srv) => srv.server.name !== serverName),
        }));
        notifyChange("removeServer", { serverName });
      },
      [notifyChange],
    ),

    toggleTool: useCallback(
      (serverName: string, toolName: string) => {
        setState((s) => ({
          ...s,
          servers: s.servers.map((srv) => {
            if (srv.server.name !== serverName) return srv;
            const isSelected = srv.selectedTools.includes(toolName);
            return {
              ...srv,
              selectedTools: isSelected
                ? srv.selectedTools.filter((t) => t !== toolName)
                : [...srv.selectedTools, toolName],
            };
          }),
        }));
        notifyChange("toggleTool", { serverName, toolName });
      },
      [notifyChange],
    ),

    selectAllTools: useCallback(
      (serverName: string) => {
        setState((s) => ({
          ...s,
          servers: s.servers.map((srv) => {
            if (srv.server.name !== serverName) return srv;
            return {
              ...srv,
              selectedTools: srv.server.tools.map((t) => t.name),
            };
          }),
        }));
        notifyChange("selectAllTools", { serverName });
      },
      [notifyChange],
    ),

    deselectAllTools: useCallback(
      (serverName: string) => {
        setState((s) => ({
          ...s,
          servers: s.servers.map((srv) => {
            if (srv.server.name !== serverName) return srv;
            return { ...srv, selectedTools: [] };
          }),
        }));
        notifyChange("deselectAllTools", { serverName });
      },
      [notifyChange],
    ),

    addWorkflowStep: useCallback(
      (serverName: string, toolName: string) => {
        const stepId = `step-${Date.now()}`;
        setState((s) => ({
          ...s,
          workflowSteps: [
            ...s.workflowSteps,
            { id: stepId, serverName, toolName },
          ],
        }));
        notifyChange("addWorkflowStep", { serverName, toolName, stepId });
      },
      [notifyChange],
    ),

    removeWorkflowStep: useCallback(
      (stepId: string) => {
        setState((s) => ({
          ...s,
          workflowSteps: s.workflowSteps.filter((step) => step.id !== stepId),
        }));
        notifyChange("removeWorkflowStep", { stepId });
      },
      [notifyChange],
    ),

    setActiveTab: useCallback(
      (tab: "aggregation" | "workflows" | "yaml") => {
        setState((s) => ({ ...s, activeTab: tab }));
        notifyChange("setActiveTab", { tab });
      },
      [notifyChange],
    ),

    setYaml: useCallback((yaml: string | null) => {
      setState((s) => ({ ...s, yaml }));
    }, []),

    reset: useCallback(() => {
      setState(initialState);
      notifyChange("reset");
    }, [notifyChange]),

    getConfig: useCallback((): VMCPConfig => {
      return {
        name: state.name,
        description: state.description,
        groupName: "default-group",
        aggregation: {
          conflictResolution: "prefix",
          tools: state.servers
            .filter((srv) => srv.selectedTools.length > 0)
            .map((srv) => ({
              workload: srv.server.name,
              filter: srv.selectedTools,
            })),
        },
        compositeTools:
          state.workflowSteps.length > 0
            ? [
                {
                  name: `${state.name}-workflow`,
                  description: `Workflow for ${state.name}`,
                  steps: state.workflowSteps.map((step) => ({
                    id: step.id,
                    type: "tool" as const,
                    tool: { workload: step.serverName, name: step.toolName },
                  })),
                },
              ]
            : undefined,
      };
    }, [state]),
  };

  return (
    <VMCPBuilderContext.Provider value={{ state, actions, onBuilderChange }}>
      {children}
    </VMCPBuilderContext.Provider>
  );
}

/**
 * Hook to access the vMCP builder context
 */
export function useVMCPBuilder() {
  const context = useContext(VMCPBuilderContext);
  if (!context) {
    throw new Error("useVMCPBuilder must be used within a VMCPBuilderProvider");
  }
  return context;
}

/**
 * Hook to access only the builder state (for read-only access)
 */
export function useVMCPBuilderState() {
  const { state } = useVMCPBuilder();
  return state;
}

/**
 * Hook to access only the builder actions
 */
export function useVMCPBuilderActions() {
  const { actions } = useVMCPBuilder();
  return actions;
}
