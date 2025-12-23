"use client";

import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type BuilderCommand,
  builderCommandBus,
} from "@/features/artifacts/contexts/builder-command-bus";
import { ArtifactPart, extractArtifactFromOutput } from "./artifact-part";
import type { MessagePart } from "./helpers";
import { ToolOutputContent } from "./tool-output";

/**
 * Checks if an output contains a builder command
 */
function extractBuilderCommand(output: unknown): BuilderCommand | null {
  if (!output || typeof output !== "object") return null;

  if ("command" in output && output.command) {
    const cmd = output.command as Record<string, unknown>;
    if (cmd.action && cmd.timestamp) {
      return cmd as unknown as BuilderCommand;
    }
  }

  return null;
}

interface ToolCallProps {
  part: MessagePart;
}

export function ToolCall({ part }: ToolCallProps) {
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isOutputOpen, setIsOutputOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Handle both static tools (type: "tool-{name}") and dynamic tools (type: "dynamic-tool")
  const isDynamicTool = part.type === "dynamic-tool";
  const isStaticTool = part.type.startsWith("tool-");

  if (!isDynamicTool && !isStaticTool) return null;

  const toolName = isDynamicTool
    ? ((part as { toolName?: string }).toolName ?? "unknown")
    : part.type.replace("tool-", "");

  const toolCallId = "toolCallId" in part ? String(part.toolCallId) : "unknown";
  const hasState = "state" in part;
  const state = hasState ? (part as { state?: string }).state : null;

  // Check if output contains an artifact
  const output = "output" in part ? part.output : undefined;
  const artifact = useMemo(() => extractArtifactFromOutput(output), [output]);

  // Check if output contains a builder command and send it
  const builderCommand = useMemo(() => extractBuilderCommand(output), [output]);

  // Send builder command when detected
  useEffect(() => {
    if (builderCommand && state === "output-available") {
      builderCommandBus.sendCommand(builderCommand);
    }
  }, [builderCommand, state]);

  return (
    <div className="bg-card mb-3 rounded-lg border p-3">
      <div className="mb-2 flex items-center gap-2">
        <Wrench className="size-4 text-blue-500" />
        <span className="text-foreground text-sm font-medium">
          Tool: {toolName}
        </span>

        {state === "output-available" && (
          <CheckCircle className="size-4 text-green-500" />
        )}
        {state === "output-error" && (
          <AlertCircle className="size-4 text-red-500" />
        )}
        {state === "input-streaming" && (
          <div className="flex items-center gap-1">
            <div className="size-3 animate-spin rounded-full border border-blue-500 border-t-transparent" />
            <span className="text-muted-foreground text-xs">Streaming...</span>
          </div>
        )}

        <span className="bg-muted text-muted-foreground rounded px-2 py-1 font-mono text-xs">
          ID: {toolCallId.slice(-8)}
        </span>
      </div>

      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="text-muted-foreground hover:text-foreground h-auto gap-2 p-0 text-xs"
        >
          {isDetailsOpen ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
          <span>Tool Details</span>
        </Button>

        {isDetailsOpen && (
          <div className="text-muted-foreground mt-2 space-y-1 text-xs">
            <div>
              <strong>Tool Name:</strong> {toolName}
            </div>
            <div>
              <strong>Call ID:</strong>{" "}
              <code className="bg-muted rounded px-1">{toolCallId}</code>
            </div>
            <div>
              <strong>Type:</strong> {part.type}
            </div>
            {hasState && (
              <div>
                <strong>State:</strong>{" "}
                <span className="capitalize">{state}</span>
              </div>
            )}
            {"providerExecuted" in part && (
              <div>
                <strong>Provider Executed:</strong>{" "}
                {(part as { providerExecuted?: boolean }).providerExecuted
                  ? "Yes"
                  : "No"}
              </div>
            )}
          </div>
        )}
      </div>

      {"input" in part && part.input !== undefined && (
        <div className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsInputOpen(!isInputOpen)}
            className="text-muted-foreground hover:text-foreground h-auto gap-2 p-0 text-xs"
          >
            {isInputOpen ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            <span>Input Parameters</span>
            {state === "input-streaming" && (
              <span className="text-blue-500">(Streaming...)</span>
            )}
          </Button>
          {isInputOpen && (
            <div className="mt-2">
              <pre className="bg-background overflow-x-auto rounded border p-2 text-xs">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {"output" in part && part.output !== undefined && (
        <div className="mt-2">
          {/* Render artifact if present */}
          {artifact ? (
            <ArtifactPart artifact={artifact} />
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOutputOpen(!isOutputOpen)}
                className="text-muted-foreground hover:text-foreground h-auto gap-2 p-0 text-xs"
              >
                {isOutputOpen ? (
                  <ChevronDown className="size-3" />
                ) : (
                  <ChevronRight className="size-3" />
                )}
                <span>Tool Result</span>
                <CheckCircle className="size-3 text-green-500" />
              </Button>
              {isOutputOpen && (
                <div className="mt-2">
                  <ToolOutputContent output={part.output} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {state === "output-error" && (
        <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-950/20">
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="size-4" />
            <strong>Tool Execution Error</strong>
          </div>
          <div className="mt-1 text-xs text-red-700 dark:text-red-300">
            {"errorText" in part ? part.errorText : "Tool execution failed"}
          </div>
        </div>
      )}

      <div className="border-border mt-2 border-t pt-2">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>
            Status:{" "}
            <span className="font-medium capitalize">{state || "Unknown"}</span>
          </span>
          {"input" in part &&
            part.input !== undefined &&
            "output" in part &&
            part.output !== undefined && (
              <span className="text-green-600 dark:text-green-400">
                ✓ Completed
              </span>
            )}
        </div>
      </div>
    </div>
  );
}
