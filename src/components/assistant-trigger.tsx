"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarOptional } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AssistantTrigger() {
  const sidebar = useSidebarOptional();

  if (!sidebar) {
    return null;
  }

  const { toggleSidebar, open } = sidebar;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={open ? "secondary" : "ghost"}
            size="icon"
            onClick={toggleSidebar}
            className="size-9"
            aria-label="Toggle Assistant"
          >
            <MessageCircle className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>AI Assistant (⌘B)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
