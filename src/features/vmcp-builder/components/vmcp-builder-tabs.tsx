"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VMCPFlowEditor } from "./vmcp-flow-editor";
import { WorkflowEditor } from "./workflow-editor";
import type { MCPServerWithTools } from "@/features/vmcp-builder/types";

interface VMCPBuilderTabsProps {
  servers: MCPServerWithTools[];
}

/**
 * Main component with tabs for Aggregation (Step 1) and Workflows (Step 2).
 */
export function VMCPBuilderTabs({ servers }: VMCPBuilderTabsProps) {
  const [activeTab, setActiveTab] = useState<"aggregation" | "workflows">(
    "aggregation",
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "aggregation" | "workflows")}
      className="flex flex-col h-full"
    >
      <div className="border-b border-border px-4">
        <TabsList className="w-auto">
          <TabsTrigger value="aggregation">Aggregation</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="aggregation" className="flex-1 m-0 mt-0">
        <VMCPFlowEditor servers={servers} />
      </TabsContent>

      <TabsContent value="workflows" className="flex-1 m-0 mt-0">
        <WorkflowEditor servers={servers} />
      </TabsContent>
    </Tabs>
  );
}

