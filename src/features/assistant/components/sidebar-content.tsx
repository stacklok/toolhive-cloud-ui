"use client";

import { ChatInterface } from "@/components/chat/chat-interface";

export function AssistantSidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <ChatInterface />
    </div>
  );
}
