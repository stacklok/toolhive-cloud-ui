"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

interface ToolhiveIconProps {
  className?: string;
  size?: number;
}

/**
 * Theme-aware ToolHive icon that displays the appropriate variant
 * based on the current theme (light/dark mode).
 */
export function ToolhiveIcon({ className, size = 24 }: ToolhiveIconProps) {
  const { resolvedTheme } = useTheme();

  const iconSrc =
    resolvedTheme === "dark"
      ? "/toolhive-icon-dark.svg"
      : "/toolhive-icon-light.svg";

  return (
    <Image
      src={iconSrc}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
    />
  );
}
