"use client";

import { CopyUrlButton } from "@/components/copy-url-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { V0ServerJson } from "@/generated/types.gen";
import { isVirtualMCPServer } from "@/lib/utils";

interface ServerCardProps {
  server: V0ServerJson;
  serverUrl?: string;
  onClick?: () => void;
}

/**
 * Server card component that displays MCP server information
 * from the catalog
 */
export function ServerCard({ server, serverUrl, onClick }: ServerCardProps) {
  const { name, description, repository } = server;
  const author = repository?.id;
  const isVirtualMCP = isVirtualMCPServer(server);

  return (
    <Card
      className="flex h-full w-full flex-col shadow-none rounded-md gap-4"
      onClick={onClick ? () => onClick() : undefined}
    >
      <CardHeader className="gap-2 pb-2 cursor-pointer">
        <CardTitle className="text-xl font-semibold leading-7 tracking-tight">
          {name}
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5 text-xs leading-5">
          {author && <span>{author}</span>}
          {isVirtualMCP && (
            <Badge
              variant="secondary"
              className="text-xs font-semibold leading-4"
            >
              Virtual MCP
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="line-clamp-3 text-sm leading-[18px] text-muted-foreground cursor-pointer">
          {description || "No description available"}
        </p>
        {serverUrl && (
          <CopyUrlButton url={serverUrl} className="w-fit cursor-pointer" />
        )}
      </CardContent>
    </Card>
  );
}
