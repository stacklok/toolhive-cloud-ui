import { NavigateBackButton } from "@/components/navigate-back-button";
import { Badge } from "@/components/ui/badge";
import type { V0ServerJson } from "@/generated";
import { isVirtualMCPServer } from "@/lib/utils";

interface ServerDetailTitleProps {
  server: V0ServerJson;
  version: string;
}

export function ServerDetailTitle({ server, version }: ServerDetailTitleProps) {
  const { name, repository } = server;
  const serverName = name || "Unknown server";
  const publisher = repository?.source;
  const type = server.remotes?.[0]?.type;

  return (
    <div className="flex flex-col gap-5">
      <NavigateBackButton
        href="/catalog"
        variant="secondary"
        size="sm"
        className="w-fit"
      />

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{serverName}</h1>
        <div className="flex items-center gap-2">
          {isVirtualMCPServer(server) && (
            <Badge
              variant="secondary"
              className="text-xs font-semibold rounded-full"
            >
              Virtual MCP Server
            </Badge>
          )}
          {type && (
            <Badge variant="secondary" className="text-xs">
              {type}
            </Badge>
          )}
          {version && (
            <Badge variant="secondary" className="text-xs">
              v{version}
            </Badge>
          )}
        </div>
        <div className="flex items-center">
          {publisher && (
            <span className="text-xs text-muted-foreground">{publisher}</span>
          )}
        </div>
      </div>
    </div>
  );
}
