"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "./ui/button";
import { Button } from "./ui/button";

interface HistoryBackProps {
  className?: string;
  href?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

export function NavigateBackButton({
  className,
  href = "/",
  variant = "outline",
  size = "sm",
}: HistoryBackProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn("cursor-pointer rounded-full", className)}
    >
      <ChevronLeft className="size-4" />
      Back
    </Button>
  );
}
