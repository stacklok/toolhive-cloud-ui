"use client";

/**
 * Command sent from AI to modify the vMCP builder
 */
export interface BuilderCommand {
  action:
    | "add_server"
    | "remove_server"
    | "select_tools"
    | "deselect_tools"
    | "set_name"
    | "set_description"
    | "add_workflow_step"
    | "switch_tab"
    | "get_state";
  serverName?: string;
  tools?: string[];
  name?: string;
  description?: string;
  toolName?: string;
  tab?: "aggregation" | "workflows" | "yaml";
  timestamp: number;
}

/**
 * Callback type for command handlers
 */
export type CommandHandler = (command: BuilderCommand) => void;

/**
 * Callback for state updates from builder to chat
 */
export type StateUpdateCallback = (state: {
  name: string;
  description: string;
  servers: Array<{ name: string; selectedTools: string[] }>;
  yaml: string | null;
  activeTab: string;
}) => void;

/**
 * Global command bus for communication between AI chat and vMCP builder
 *
 * This provides a simple pub/sub mechanism for:
 * - AI → Builder: Commands to modify the builder
 * - Builder → AI: State updates when user makes changes
 */
class BuilderCommandBus {
  private commandHandlers: Set<CommandHandler> = new Set();
  private stateUpdateCallbacks: Set<StateUpdateCallback> = new Set();
  private pendingCommands: BuilderCommand[] = [];

  /**
   * Send a command from the AI to the builder
   */
  sendCommand(command: BuilderCommand): void {
    if (this.commandHandlers.size === 0) {
      // Queue command if no handlers registered yet
      this.pendingCommands.push(command);
      return;
    }

    for (const handler of this.commandHandlers) {
      handler(command);
    }
  }

  /**
   * Register a command handler (called by the builder component)
   */
  registerCommandHandler(handler: CommandHandler): () => void {
    this.commandHandlers.add(handler);

    // Process any pending commands
    for (const command of this.pendingCommands) {
      handler(command);
    }
    this.pendingCommands = [];

    return () => {
      this.commandHandlers.delete(handler);
    };
  }

  /**
   * Notify the chat of state changes
   */
  notifyStateUpdate(state: {
    name: string;
    description: string;
    servers: Array<{ name: string; selectedTools: string[] }>;
    yaml: string | null;
    activeTab: string;
  }): void {
    for (const callback of this.stateUpdateCallbacks) {
      callback(state);
    }
  }

  /**
   * Register a state update callback (called by the chat component)
   */
  registerStateUpdateCallback(callback: StateUpdateCallback): () => void {
    this.stateUpdateCallbacks.add(callback);
    return () => {
      this.stateUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Check if a builder is currently active
   */
  hasActiveBuilder(): boolean {
    return this.commandHandlers.size > 0;
  }
}

// Singleton instance
export const builderCommandBus = new BuilderCommandBus();

// Expose to window for debugging in development
if (typeof window !== "undefined") {
  (
    window as unknown as { __builderCommandBus: BuilderCommandBus }
  ).__builderCommandBus = builderCommandBus;
}
