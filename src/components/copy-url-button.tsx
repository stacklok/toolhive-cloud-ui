"use client";

import { Copy } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyUrlButtonProps
  extends Omit<ComponentPropsWithoutRef<typeof Button>, "onClick"> {
  url: string;
  labelClassName?: string;
}

/**
 * Reusable button component to copy MCP server URLs to clipboard
 */
export function CopyUrlButton({
  url,
  variant = "secondary",
  size = "sm",
  className,
  labelClassName,
  ...props
}: CopyUrlButtonProps) {
  const handleCopyUrl = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Successfully copied");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopyUrl}
      aria-label="Copy URL"
      className={cn("cursor-pointer", className)}
      {...props}
    >
      <Copy className="size-4" />
      <span className={cn(labelClassName)}>Copy URL</span>
    </Button>
  );
}
