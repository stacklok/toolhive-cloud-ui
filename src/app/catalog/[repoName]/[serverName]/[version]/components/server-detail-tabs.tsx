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
    <Tabs defaultValue="about">
      <TabsList className="mb-4">
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="tools">Tools</TabsTrigger>
      </TabsList>
      <TabsContent value="about">{children}</TabsContent>
      <TabsContent value="tools">
        <ServerToolsTable tools={tools} />
      </TabsContent>
    </Tabs>
  );
}
