"use client";

import {
  AlertCircle,
  CheckCheck,
  ListX,
  Loader2,
  Search,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMcpServerTools } from "@/app/assistant/mcp-actions";
import { useMcpSettings } from "@/app/assistant/mcp-settings-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface McpToolsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverName: string;
}

export function McpToolsModal({
  open,
  onOpenChange,
  serverName,
}: McpToolsModalProps) {
  const {
    serverTools,
    enabledTools,
    toggleTool,
    enableAllTools,
    disableAllTools,
    setServerTools,
  } = useMcpSettings();

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tools = serverTools.get(serverName) ?? [];
  const enabledToolsSet = enabledTools.get(serverName) ?? new Set<string>();

  // Fetch tools when modal opens and we don't have them yet
  const fetchTools = useCallback(async () => {
    if (!serverName || tools.length > 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getMcpServerTools(serverName);
      if (response.error) {
        setError(response.error);
      } else if (response.tools.length > 0) {
        setServerTools(serverName, response.tools);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tools");
    } finally {
      setIsLoading(false);
    }
  }, [serverName, tools.length, setServerTools]);

  useEffect(() => {
    if (open && serverName) {
      fetchTools();
    }
  }, [open, serverName, fetchTools]);

  const filteredTools = useMemo(() => {
    if (!searchQuery) return tools;
    const query = searchQuery.toLowerCase();
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query),
    );
  }, [tools, searchQuery]);

  const enabledCount = enabledToolsSet.size;
  const totalCount = tools.length;

  const handleClose = () => {
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[80vh] min-h-[50vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Manage tools
          </DialogTitle>
          <DialogDescription
            aria-describedby={`Manage the tools for ${serverName}`}
          >
            <span className="flex items-center gap-1">
              {serverName}
              <Badge variant="secondary" className="text-muted-foreground">
                {enabledCount} tools enabled
              </Badge>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => enableAllTools(serverName)}
            disabled={enabledCount === totalCount || isLoading}
            className="cursor-pointer text-xs"
          >
            <CheckCheck className="size-4" />
            Enable All
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => disableAllTools(serverName)}
            disabled={enabledCount === 0 || isLoading}
            className="cursor-pointer text-xs"
          >
            <ListX className="size-4" />
            Disable All
          </Button>
        </div>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className={cn("min-h-0 flex-1 overflow-y-auto pr-4")}>
          <div className="space-y-2 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground size-6 animate-spin" />
                <span className="text-muted-foreground ml-2 text-sm">
                  Loading tools...
                </span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="size-4" />
                  {error}
                </div>
              </div>
            ) : tools.length === 0 ? (
              <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
                No tools available. Server may not be running.
              </div>
            ) : filteredTools.length === 0 ? (
              <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
                No tools match your search.
              </div>
            ) : (
              filteredTools.map((tool) => (
                <div
                  key={tool.name}
                  className="bg-card hover:bg-accent/50 flex items-start justify-between gap-3 rounded-lg border p-4 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Wrench className="size-4 shrink-0 text-blue-500" />
                      <h4 className="text-sm font-medium">{tool.name}</h4>
                    </div>
                    {tool.description ? (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {tool.description}
                      </p>
                    ) : (
                      <p className="text-muted-foreground/60 text-sm italic">
                        No description available
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={enabledToolsSet.has(tool.name)}
                    onCheckedChange={() => toggleTool(serverName, tool.name)}
                    className="mt-1 shrink-0"
                  />
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
