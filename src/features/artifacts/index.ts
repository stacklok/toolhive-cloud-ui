/**
 * Artifacts Feature
 *
 * Interactive UI components that can be rendered inline in chat messages.
 * Artifacts are triggered by tool calls from the AI.
 */

export { ArtifactContainer } from "./components/artifact-container";

// Components
export { ArtifactRenderer } from "./components/artifact-renderer";
export { VMCPBuilderArtifact } from "./components/vmcp-builder-artifact";
// Context & Command Bus for bidirectional communication
export {
  type BuilderCommand,
  builderCommandBus,
  type CommandHandler,
  type StateUpdateCallback,
} from "./contexts/builder-command-bus";
export {
  type BuilderServerState,
  type BuilderWorkflowStep,
  useVMCPBuilder,
  useVMCPBuilderActions,
  useVMCPBuilderState,
  type VMCPBuilderActions,
  VMCPBuilderProvider,
  type VMCPBuilderState,
} from "./contexts/vmcp-builder-context";
// Types
export * from "./types";
