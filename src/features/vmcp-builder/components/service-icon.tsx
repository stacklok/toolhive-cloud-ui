"use client";

import type { ServiceIconName } from "@/features/vmcp-builder/types";
import {
  Github,
  Slack,
  Ticket,
  Database,
  Folder,
  Server,
  Code,
  Globe,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<ServiceIconName, LucideIcon> = {
  github: Github,
  slack: Slack,
  ticket: Ticket,
  database: Database,
  folder: Folder,
  server: Server,
  code: Code,
  globe: Globe,
};

interface ServiceIconProps {
  iconName?: ServiceIconName;
  iconUrl?: string;
  alt?: string;
  className?: string;
}

/**
 * Renders a service icon based on iconName (Lucide) or iconUrl (external image).
 * Falls back to Server icon if neither is provided.
 */
export function ServiceIcon({
  iconName,
  iconUrl,
  alt,
  className = "h-5 w-5",
}: ServiceIconProps) {
  // Priority: iconName (Lucide) > iconUrl (external) > fallback (Server)
  if (iconName && iconMap[iconName]) {
    const Icon = iconMap[iconName];
    return <Icon className={className} />;
  }

  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt={alt ?? "Service icon"}
        className={className}
        onError={(e) => {
          // Hide broken image and show nothing (parent should have fallback styling)
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  // Fallback
  return <Server className={className} />;
}

