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
import { MCP_CLIENT_LIST } from "@/lib/mcp/client-configs";

interface AddMcpClientDropdownProps {
  serverName: string;
  serverUrl: string;
}

export function AddMcpToClientDropdown({
  serverName,
  serverUrl,
}: AddMcpClientDropdownProps) {
  const { openInClient, copyCommand } = useAddMcpToClient({
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
        {MCP_CLIENT_LIST.map(({ client, label, action }) => (
          <DropdownMenuItem
            key={client}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (action === "open") {
                openInClient(client);
              } else {
                copyCommand(client);
              }
            }}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
