"use client";

import {
  Check,
  Code2,
  Copy,
  Rocket,
  Server,
  Settings,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VirtualMCPServerSpec } from "@/features/vmcp-builder/types";

interface VMCPPreviewPanelProps {
  spec: VirtualMCPServerSpec | null;
  yaml: string | null;
  isLoading: boolean;
  onDeploy: () => void;
}

/**
 * Panel showing the vMCP configuration preview and YAML output.
 */
export function VMCPPreviewPanel({
  spec,
  yaml,
  isLoading,
  onDeploy,
}: VMCPPreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showYaml, setShowYaml] = useState(false);

  const handleCopy = async () => {
    if (yaml) {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalTools =
    spec?.aggregation.tools.reduce((acc, t) => acc + t.filter.length, 0) ?? 0;

  if (!spec) {
    return (
      <div className="flex flex-col h-full bg-card border-l border-border">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm">Configuration</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Add MCP servers and select tools to see the configuration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Configuration</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowYaml(!showYaml)}
            className="h-7 px-2"
          >
            <Code2 className="h-4 w-4 mr-1" />
            {showYaml ? "Summary" : "YAML"}
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          <Badge variant="secondary" className="gap-1">
            <Server className="h-3 w-3" />
            {spec.aggregation.tools.length} servers
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Wrench className="h-3 w-3" />
            {totalTools} tools
          </Badge>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {showYaml ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">
                VirtualMCPServer CRD
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto font-mono">
              {yaml || "Loading..."}
            </pre>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <p className="font-medium">{spec.name || "Unnamed vMCP"}</p>
            </div>

            {/* Description */}
            {spec.description && (
              <div>
                <label className="text-xs text-muted-foreground">
                  Description
                </label>
                <p className="text-sm">{spec.description}</p>
              </div>
            )}

            {/* Conflict Resolution */}
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Conflict Resolution
              </label>
              <Badge variant="outline" className="mt-1">
                {spec.aggregation.conflictResolution}
              </Badge>
            </div>

            {/* Tools by server */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                Selected Tools
              </label>
              <div className="space-y-3">
                {spec.aggregation.tools.map((workload) => (
                  <div
                    key={workload.workload}
                    className="p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <p className="font-medium text-sm mb-2">
                      {workload.workload}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {workload.filter.map((tool) => (
                        <Badge
                          key={tool}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Deploy button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={onDeploy}
          disabled={isLoading || totalTools === 0}
          className="w-full"
        >
          <Rocket className="h-4 w-4 mr-2" />
          {isLoading ? "Deploying..." : "Deploy vMCP"}
        </Button>
      </div>
    </div>
  );
}
