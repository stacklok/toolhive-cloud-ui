"use client";

import { IllustrationEmptyInbox } from "@/components/illustrations/illustration-empty-inbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ServerTool } from "@/lib/schemas/server-meta";

function EmptyToolsTable() {
  return (
    <TableRow>
      <TableCell colSpan={2} className="py-12">
        <div className="flex flex-col items-center gap-3">
          <IllustrationEmptyInbox className="size-24" />
          <p className="text-sm text-muted-foreground">No tools available</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface ServerToolsTableProps {
  tools: ServerTool[];
}

export function ServerToolsTable({ tools }: ServerToolsTableProps) {
  return (
    <div className="rounded-lg border max-h-[70vh] overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow className="h-12">
            <TableHead className="w-56 p-3">Tools</TableHead>
            <TableHead className="p-3">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools.length === 0 ? (
            <EmptyToolsTable />
          ) : (
            tools.map((tool) => (
              <TableRow key={tool.name} className="h-12 bg-background">
                <TableCell className="p-3 font-medium">{tool.name}</TableCell>
                <TableCell className="p-3 text-muted-foreground whitespace-normal">
                  {tool.description ?? "No description"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
