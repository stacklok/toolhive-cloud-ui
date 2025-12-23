"use client";

import { Check, Code, Copy, Layers, Loader2, Workflow } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type FlowEditorHandle,
  VMCPFlowEditor,
} from "@/features/vmcp-builder/components/vmcp-flow-editor";
import { WorkflowEditor } from "@/features/vmcp-builder/components/workflow-editor";
import { mockMCPServersWithTools } from "@/features/vmcp-builder/mocks/fixtures";
import type {
  MCPServerWithTools,
  VirtualMCPServerSpec,
} from "@/features/vmcp-builder/types";
import {
  type BuilderCommand,
  builderCommandBus,
} from "../contexts/builder-command-bus";
import type { VMCPBuilderArtifact as VMCPBuilderArtifactType } from "../types";
import { ArtifactContainer } from "./artifact-container";

interface VMCPBuilderArtifactProps {
  artifact: VMCPBuilderArtifactType;
  onClose?: () => void;
  onDeploy?: (spec: VirtualMCPServerSpec) => void;
}

/**
 * vMCP Builder Artifact Component
 *
 * Renders an interactive React Flow editor for building Virtual MCP Servers.
 * Includes tabs for:
 * - Aggregation: Combine tools from multiple MCP servers
 * - Workflows: Create composite tool workflows
 * - YAML: Preview the generated configuration
 */
export function VMCPBuilderArtifact({
  artifact,
  onClose,
  onDeploy: _onDeploy,
}: VMCPBuilderArtifactProps) {
  const [activeTab, setActiveTab] = useState<
    "aggregation" | "workflows" | "yaml"
  >("aggregation");
  const [servers, setServers] = useState<MCPServerWithTools[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [yamlContent, setYamlContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [vmcpName, setVmcpName] = useState(
    artifact.data.initialConfig?.name ?? artifact.title ?? "my-vmcp"
  );
  const [vmcpDescription, setVmcpDescription] = useState(
    artifact.data.initialConfig?.description ?? artifact.description ?? ""
  );

  // Track servers added to the canvas with their selected tools
  const [canvasServers] = useState<
    Map<string, { server: MCPServerWithTools; selectedTools: string[] }>
  >(new Map());

  // Refs for imperative control of editors
  const aggregationEditorRef = useRef<FlowEditorHandle>(null);
  // Note: WorkflowEditor does not support refs yet (POC limitation)

  // Load available MCP servers
  useEffect(() => {
    async function loadServers() {
      setIsLoading(true);
      try {
        // For POC, use mock data
        // In production, this would call a server action
        setServers(mockMCPServersWithTools);
      } catch (error) {
        console.error("Failed to load MCP servers:", error);
        toast.error("Failed to load MCP servers");
      } finally {
        setIsLoading(false);
      }
    }

    loadServers();
  }, []);

  // Handle commands from AI
  const handleCommand = useCallback(
    (command: BuilderCommand) => {
      // Currently only aggregation editor supports imperative control
      const activeEditor = aggregationEditorRef.current;

      switch (command.action) {
        case "add_server":
          if (command.serverName) {
            const server = servers.find((s) => s.name === command.serverName);
            if (server) {
              activeEditor?.addServer(command.serverName, command.tools);
              toast.success(`Added ${server.title} to the builder`);
            } else {
              toast.error(`Server "${command.serverName}" not found`);
            }
          }
          break;

        case "remove_server":
          if (command.serverName) {
            activeEditor?.removeServer(command.serverName);
            toast.success(`Removed ${command.serverName} from the builder`);
          }
          break;

        case "select_tools":
          if (command.serverName && command.tools) {
            activeEditor?.selectTools(command.serverName, command.tools);
            toast.success(
              `Selected ${command.tools.length} tools for ${command.serverName}`
            );
          }
          break;

        case "deselect_tools":
          if (command.serverName && command.tools) {
            activeEditor?.deselectTools(command.serverName, command.tools);
            toast.success(
              `Deselected ${command.tools.length} tools for ${command.serverName}`
            );
          }
          break;

        case "set_name":
          if (command.name) {
            setVmcpName(command.name);
            toast.success(`Set vMCP name to "${command.name}"`);
          }
          break;

        case "set_description":
          if (command.description !== undefined) {
            setVmcpDescription(command.description);
            toast.success("Updated vMCP description");
          }
          break;

        case "switch_tab":
          if (command.tab) {
            setActiveTab(command.tab);
            toast.success(`Switched to ${command.tab} tab`);
          }
          break;

        case "get_state": {
          // State is returned via the command bus
          const state = activeEditor?.getState();
          builderCommandBus.notifyStateUpdate({
            name: vmcpName,
            description: vmcpDescription,
            servers:
              state?.servers ??
              Array.from(canvasServers.values()).map((s) => ({
                name: s.server.name,
                selectedTools: s.selectedTools,
              })),
            yaml: yamlContent,
            activeTab,
          });
          break;
        }
      }
    },
    [activeTab, servers, vmcpName, vmcpDescription, canvasServers, yamlContent]
  );

  // Register command handler
  useEffect(() => {
    const unsubscribe = builderCommandBus.registerCommandHandler(handleCommand);
    return unsubscribe;
  }, [handleCommand]);

  // Notify state changes when user modifies the builder
  // TODO: Wire this up to editor callbacks when user makes changes
  const _notifyStateChange = useCallback(() => {
    builderCommandBus.notifyStateUpdate({
      name: vmcpName,
      description: vmcpDescription,
      servers: Array.from(canvasServers.values()).map((s) => ({
        name: s.server.name,
        selectedTools: s.selectedTools,
      })),
      yaml: yamlContent,
      activeTab,
    });
  }, [vmcpName, vmcpDescription, canvasServers, yamlContent, activeTab]);

  // Handle YAML generation from the flow editors
  const handleYamlChange = useCallback((yaml: string | null) => {
    setYamlContent(yaml);
  }, []);

  // Copy YAML to clipboard
  const handleCopyYaml = useCallback(async () => {
    if (!yamlContent) return;

    try {
      await navigator.clipboard.writeText(yamlContent);
      setCopied(true);
      toast.success("YAML copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy YAML");
    }
  }, [yamlContent]);

  if (isLoading) {
    return (
      <ArtifactContainer artifact={artifact} onClose={onClose}>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ArtifactContainer>
    );
  }

  return (
    <ArtifactContainer artifact={artifact} onClose={onClose}>
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as "aggregation" | "workflows" | "yaml")
        }
        className="flex h-full flex-col"
      >
        <div className="border-b border-border bg-muted/30 px-4">
          <TabsList className="h-10 bg-transparent">
            <TabsTrigger
              value="aggregation"
              className="gap-2 data-[state=active]:bg-background"
            >
              <Layers className="h-4 w-4" />
              Aggregation
            </TabsTrigger>
            <TabsTrigger
              value="workflows"
              className="gap-2 data-[state=active]:bg-background"
            >
              <Workflow className="h-4 w-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger
              value="yaml"
              className="gap-2 data-[state=active]:bg-background"
            >
              <Code className="h-4 w-4" />
              YAML Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="aggregation"
          className="mt-0 flex-1 data-[state=inactive]:hidden"
        >
          <div className="h-[500px]">
            <VMCPFlowEditor
              ref={aggregationEditorRef}
              servers={servers}
              initialServers={artifact.data.initialServers}
              vmcpName={vmcpName}
              vmcpDescription={vmcpDescription}
              onYamlChange={handleYamlChange}
              embedded
            />
          </div>
        </TabsContent>

        <TabsContent
          value="workflows"
          className="mt-0 flex-1 data-[state=inactive]:hidden"
        >
          <div className="h-[500px]">
            <WorkflowEditor
              servers={servers}
              onYamlChange={handleYamlChange}
              embedded
            />
          </div>
        </TabsContent>

        <TabsContent
          value="yaml"
          className="mt-0 flex-1 data-[state=inactive]:hidden"
        >
          <div className="relative h-[500px]">
            {/* Copy button */}
            <div className="absolute right-4 top-4 z-10">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopyYaml}
                disabled={!yamlContent}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <ScrollArea className="h-full">
              <div className="p-4">
                {yamlContent ? (
                  <pre className="rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100 font-mono whitespace-pre-wrap">
                    {yamlContent}
                  </pre>
                ) : (
                  <div className="flex h-80 items-center justify-center text-muted-foreground">
                    <p>
                      Configure your vMCP in the Aggregation or Workflows tab to
                      see the YAML preview.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </ArtifactContainer>
  );
}
