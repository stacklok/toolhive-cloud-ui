"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VMCPBuilderTabs } from "@/features/vmcp-builder";
import type { MCPServerWithTools } from "@/features/vmcp-builder/types";

interface VMCPBuilderClientProps {
  servers: MCPServerWithTools[];
}

/**
 * Client component for the vMCP Builder page.
 */
export function VMCPBuilderClient({ servers }: VMCPBuilderClientProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/catalog">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Catalog
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">vMCP Builder</h1>
              <p className="text-xs text-muted-foreground">
                Create Virtual MCP Servers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-amber-500/10 text-amber-600 px-2 py-1 rounded-full">
            POC Preview
          </span>
        </div>
      </header>

      {/* Flow Editor with Tabs */}
      <div className="flex-1 overflow-hidden">
        <VMCPBuilderTabs servers={servers} />
      </div>
    </div>
  );
}
