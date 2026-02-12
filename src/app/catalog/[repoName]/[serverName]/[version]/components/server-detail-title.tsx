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
    <div className="flex flex-col gap-4">
      <NavigateBackButton
        href="/catalog"
        variant="outline"
        size="sm"
        className="w-fit"
      />

      <div className="flex flex-col gap-1">
        <h1 className="text-page-title m-0 mb-0 p-0">{serverName}</h1>
        {publisher && (
          <div className="flex items-center mb-1">
            <span className="text-xs text-muted-foreground">{publisher}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {isVirtualMCPServer(server) && (
            <Badge variant="secondary" className="text-xs font-semibold">
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
      </div>
    </div>
  );
}
