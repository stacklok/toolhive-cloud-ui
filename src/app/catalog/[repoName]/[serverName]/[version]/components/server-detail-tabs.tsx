"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ServerTool } from "@/lib/schemas/server-meta";
import { ServerToolsTable } from "./server-tools-table";

interface ServerDetailTabsProps {
  children: ReactNode;
  tools: ServerTool[];
}

export function ServerDetailTabs({ children, tools }: ServerDetailTabsProps) {
  return (
    <Tabs defaultValue="about" className="gap-4">
      <TabsList className="h-11 rounded-xl p-1">
        <TabsTrigger
          value="about"
          className="rounded-lg border-0 px-6 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-card"
        >
          About
        </TabsTrigger>
        <TabsTrigger
          value="tools"
          className="rounded-lg border-0 px-6 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-card"
        >
          Tools
        </TabsTrigger>
      </TabsList>
      <TabsContent value="about">{children}</TabsContent>
      <TabsContent value="tools">
        <ServerToolsTable tools={tools} />
      </TabsContent>
    </Tabs>
  );
}
