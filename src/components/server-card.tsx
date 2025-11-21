"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { V0ServerJson } from "@/generated/types.gen";

interface ServerCardProps {
  server: V0ServerJson;
  serverUrl?: string;
}

/**
 * Server card component that displays MCP server information
 * from the catalog
 */
export function ServerCard({ server, serverUrl }: ServerCardProps) {
  const { name, description, repository, remotes } = server;
  const author = repository?.id;
  const isVirtualMcp = remotes && remotes.length > 0;

  const handleCopyUrl = async () => {
    if (!serverUrl) {
      toast.error("URL not available");
      return;
    }

    try {
      await navigator.clipboard.writeText(serverUrl);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <Card className="flex h-full w-full flex-col shadow-none rounded-md">
      <CardHeader className="gap-2 pb-4">
        <CardTitle className="text-xl font-semibold leading-7 tracking-tight">
          {name}
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5 text-xs leading-5">
          {author && <span>{author}</span>}
          {isVirtualMcp && (
            <Badge variant="secondary" className="text-xs">
              Virtual MCP
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="line-clamp-3 text-[13px] leading-[18px] text-muted-foreground">
          {description || "No description available"}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopyUrl}
          aria-label="Copy URL"
          className="w-fit"
        >
          <Copy className="size-4" />
          Copy URL
        </Button>
      </CardContent>
    </Card>
  );
}
