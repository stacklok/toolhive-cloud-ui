"use client";

import { CopyUrlButton } from "@/components/copy-url-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { V0ServerJson } from "@/generated/types.gen";

interface ServersTableProps {
  servers: V0ServerJson[];
  onServerClick?: (server: V0ServerJson) => void;
}

/**
 * Server table component that displays MCP servers in a table format
 */
export function ServersTable({ servers, onServerClick }: ServersTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-md border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[187px]">Server</TableHead>
            <TableHead>About</TableHead>
            <TableHead className="w-[120px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.map((server) => {
            const url = server.remotes?.[0]?.url || "";
            const serverName = server.name || "Unknown";
            const description =
              server.description || "No description available";

            return (
              <TableRow
                key={server.name}
                onClick={() => onServerClick?.(server)}
                className={onServerClick ? "cursor-pointer" : undefined}
              >
                <TableCell className="font-medium">{serverName}</TableCell>
                <TableCell className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {description}
                </TableCell>
                <TableCell>
                  <CopyUrlButton url={url} className="shadow-sm" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
