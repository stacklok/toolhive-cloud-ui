"use client";

import { MessageCircle, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { AssistantSidebarContent } from "./sidebar-content";

export function AssistantSidebar({ models }: { models: string[] }) {
  const { state, toggleSidebar, isMobile, openMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const showContent = isMobile ? openMobile : !isCollapsed;

  return (
    <Sidebar side="right" collapsible="offcanvas">
      <SidebarHeader className="flex-row items-center justify-between border-b px-4 py-3 h-16">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5" />
          <span className="font-semibold">Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        >
          <PanelRightClose className="size-4" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="p-0">
        {showContent &&
          (models.length > 0 ? (
            <AssistantSidebarContent />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
              <p className="text-muted-foreground text-center text-sm">
                OpenRouter API key is missing. Please add your API key in your
                environment variables.
              </p>
            </div>
          ))}
      </SidebarContent>
    </Sidebar>
  );
}
