"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ButtonProps } from "./ui/button";
import { Button } from "./ui/button";

interface HistoryBackProps {
  className?: string;
  fallbackUrl?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

export function HistoryBack({
  className,
  fallbackUrl = "/",
  variant = "secondary",
  size = "sm",
}: HistoryBackProps) {
  const router = useRouter();

  const handleClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <ChevronLeft className="size-4" />
      Back
    </Button>
  );
}
