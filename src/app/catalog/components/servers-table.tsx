"use client";

import { CopyUrlButton } from "@/components/copy-url-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { V0ServerJson } from "@/generated/types.gen";
import { isVirtualMCPServer } from "@/lib/utils";

interface ServersTableProps {
  servers: V0ServerJson[];
  onServerClick?: (server: V0ServerJson) => void;
}

export function ServersTable({ servers, onServerClick }: ServersTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-md border">
      <Table className="min-w-full">
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-full pl-4 sm:w-1/5">Server</TableHead>
            <TableHead className="hidden sm:w-7/10 sm:table-cell">
              About
            </TableHead>
            <TableHead className="w-16 text-right sm:w-1/10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.map((server, index) => {
            const url = server.remotes?.[0]?.url || "";
            const serverName = server.name || "Unknown";
            const description =
              server.description || "No description available";

            return (
              <TableRow
                key={server.name || `server-${index}`}
                onClick={() => onServerClick?.(server)}
                className={onServerClick ? "cursor-pointer" : undefined}
              >
                <TableCell
                  className="pl-4 align-middle sm:w-1/5 max-w-0"
                  title={serverName}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-base font-medium sm:text-sm truncate min-w-0">
                      {serverName}
                    </p>
                    {isVirtualMCPServer(server) && (
                      <Badge
                        variant="secondary"
                        className="text-xs font-semibold leading-4 shrink-0 sm:hidden"
                      >
                        Virtual MCP
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell
                  className="hidden pr-4 text-muted-foreground whitespace-normal wrap-break-word sm:table-cell sm:w-7/10"
                  title={description}
                >
                  {description}
                </TableCell>
                <TableCell className="pr-3 text-right align-middle sm:w-1/10">
                  {url ? (
                    <CopyUrlButton
                      url={url}
                      className="md:h-9 md:w-auto md:rounded-md md:px-3"
                      labelClassName="hidden md:inline"
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
