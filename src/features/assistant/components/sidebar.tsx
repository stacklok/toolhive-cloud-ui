"use client";

import { MessageCircle, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { AssistantSidebarContent } from "./sidebar-content";

export function AssistantSidebar() {
  const { state, toggleSidebar, isMobile, openMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Show content when: on mobile and sheet is open, OR on desktop and not collapsed
  const showContent = isMobile ? openMobile : !isCollapsed;

  return (
    <Sidebar side="left" collapsible="offcanvas">
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
          <PanelLeftClose className="size-4" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="p-0">
        {showContent && <AssistantSidebarContent />}
      </SidebarContent>
    </Sidebar>
  );
}
