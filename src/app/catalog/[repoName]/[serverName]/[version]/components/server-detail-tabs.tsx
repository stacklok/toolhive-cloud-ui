"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ServerTool } from "@/lib/schemas/server-meta";
import { ServerToolsTable } from "./server-tools-table";

interface ServerDetailTabsProps {
  children: ReactNode;
  tools: ServerTool[];
}

const tabs = [
  { value: "about", label: "About" },
  { value: "tools", label: "Tools" },
] as const;

export function ServerDetailTabs({ children, tools }: ServerDetailTabsProps) {
  return (
    <Tabs defaultValue="about" className="gap-4">
      <TabsList className="h-11 rounded-xl p-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-lg border-0 px-6 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-card"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="about">{children}</TabsContent>
      <TabsContent value="tools">
        <ServerToolsTable tools={tools} />
      </TabsContent>
    </Tabs>
  );
}
