"use client";

import { Copy } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CopyUrlButtonProps
  extends Omit<ComponentPropsWithoutRef<typeof Button>, "onClick"> {
  url: string;
}

/**
 * Reusable button component to copy MCP server URLs to clipboard
 */
export function CopyUrlButton({
  url,
  variant = "secondary",
  size = "sm",
  ...props
}: CopyUrlButtonProps) {
  const handleCopyUrl = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
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
      {...props}
    >
      <Copy className="size-4" />
      Copy URL
    </Button>
  );
}
