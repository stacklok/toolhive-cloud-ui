"use client";

import { ChevronDown, ChevronUp, Maximize2, Minimize2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Artifact } from "../types";

interface ArtifactContainerProps {
  artifact: Artifact;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

/**
 * Container component for artifacts.
 * Provides common UI chrome: header, expand/collapse, fullscreen toggle.
 */
export function ArtifactContainer({
  artifact,
  children,
  className,
  onClose,
}: ArtifactContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerClasses = cn(
    "rounded-xl border border-border bg-card shadow-lg overflow-hidden transition-all duration-300",
    isFullscreen && "fixed inset-4 z-50",
    !isFullscreen && "relative",
    className,
  );

  return (
    <>
      {/* Backdrop for fullscreen */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      <div className={containerClasses}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <ArtifactIcon type={artifact.type} />
            <div>
              <h3 className="text-sm font-medium text-foreground">
                {artifact.title}
              </h3>
              {artifact.description && (
                <p className="text-xs text-muted-foreground">
                  {artifact.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div
            className={cn(
              "overflow-hidden transition-all duration-300",
              isFullscreen ? "h-[calc(100%-48px)]" : "max-h-[600px]",
            )}
          >
            {children}
          </div>
        )}
      </div>
    </>
  );
}

function ArtifactIcon({ type }: { type: Artifact["type"] }) {
  const iconClasses = "h-4 w-4";

  switch (type) {
    case "vmcp-builder":
      return (
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
          <svg
            className={cn(iconClasses, "text-primary")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
      );
    case "code":
      return (
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10">
          <svg
            className={cn(iconClasses, "text-blue-500")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        </div>
      );
    case "yaml-preview":
      return (
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10">
          <svg
            className={cn(iconClasses, "text-amber-500")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      );
    default:
      return null;
  }
}
