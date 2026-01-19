"use client";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAddMcpToClient } from "@/hooks/use-add-mcp-to-client";
import { MCP_CLIENTS } from "@/lib/mcp/client-configs";

interface AddMcpClientDropdownProps {
  serverName: string;
  serverUrl: string;
}

export function AddMcpToClientDropdown({
  serverName,
  serverUrl,
}: AddMcpClientDropdownProps) {
  const { openInClient, copyCommand, copyJsonConfig } = useAddMcpToClient({
    serverName,
    config: { url: serverUrl },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex h-10 items-center justify-between gap-2"
        >
          <span>Add to client</span>
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="bottom" className="w-64">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            openInClient(MCP_CLIENTS.cursor);
          }}
        >
          Cursor
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            copyCommand(MCP_CLIENTS.vscode);
          }}
        >
          VS Code (copy CLI command)
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            copyJsonConfig(MCP_CLIENTS.vscode);
          }}
        >
          VS Code (copy MCP JSON config)
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            copyCommand(MCP_CLIENTS.claudeCode);
          }}
        >
          Claude Code (copy CLI command)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
