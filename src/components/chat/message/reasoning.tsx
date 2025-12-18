"use client";

import type { ChatStatus } from "ai";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import type { MessagePart } from "./helpers";

interface ReasoningProps {
  part: MessagePart;
  status: ChatStatus;
}

export function Reasoning({ part, status }: ReasoningProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (part.type !== "reasoning") return null;

  const reasoningText = "text" in part ? part.text : undefined;

  return (
    <div className="bg-card mb-3 rounded-lg border p-3">
      <div className="mb-2 flex items-center gap-2">
        <Brain className="size-4 text-purple-500" />
        <span className="text-foreground text-sm font-medium">
          AI Reasoning
        </span>
        {status === "streaming" && (
          <div className="flex items-center gap-1">
            <div className="size-2 animate-pulse rounded-full bg-purple-500" />
            <span className="text-muted-foreground text-xs">Thinking...</span>
          </div>
        )}
      </div>

      <div className="mb-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
          <span>View reasoning steps</span>
        </button>

        {isOpen && (
          <div className="mt-2">
            <div className="bg-background rounded border p-3 text-sm">
              <Streamdown
                isAnimating={status === "streaming"}
                className="prose prose-sm max-w-none"
                remarkPlugins={[remarkGfm]}
              >
                {reasoningText || "No reasoning content"}
              </Streamdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
