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
    <Sidebar
      side="right"
      collapsible="offcanvas"
      className="group-data-[side=right]:border-l-0"
    >
      <SidebarHeader className="flex-row items-center justify-between border-b border-l border-l-nav-border! bg-nav-background px-4 py-3 h-16">
        <div className="flex items-center gap-2 text-white">
          <MessageCircle className="size-5" />
          <span className="text-page-title text-2xl! leading-none!">
            Assistant
          </span>
        </div>
        <div className="flex items-center self-stretch -my-3">
          <div className="h-full w-px bg-nav-border mx-4" />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-white hover:text-white"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <PanelRightClose className="size-4" />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="border-l p-0">
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
