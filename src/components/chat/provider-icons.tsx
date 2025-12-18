import { Bot } from "lucide-react";
import { OpenRouterIcon } from "@/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ProviderId = "openrouter" | "openai" | "anthropic" | "google" | "xai";

const PROVIDER_ICONS: Record<ProviderId, React.ReactNode> = {
  openrouter: <OpenRouterIcon className="size-4" />,
  // TODO: Add more provider icons as needed
  openai: null,
  anthropic: null,
  google: null,
  xai: null,
};

const PROVIDER_NAMES: Record<ProviderId, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  xai: "xAI",
};

function getProviderIconWithTooltip(providerId: ProviderId): React.ReactNode {
  const icon = PROVIDER_ICONS[providerId];
  const name = PROVIDER_NAMES[providerId];

  if (!icon || !name) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center">{icon}</span>
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}

function getProviderIdFromModel(model: string): ProviderId | null {
  if (!model) return null;

  // Handle OpenRouter models with prefixes (e.g., "anthropic/claude-3")
  if (model.includes("/")) {
    return "openrouter";
  }

  // Handle direct provider models with distinctive naming patterns
  if (model.startsWith("claude-")) return "anthropic";
  if (model.startsWith("gemini-")) return "google";
  if (model.startsWith("grok-")) return "xai";
  if (
    model.startsWith("gpt-") ||
    model.startsWith("o3") ||
    model.startsWith("o4")
  ) {
    return "openai";
  }

  return null;
}

/**
 * Get provider icon by model name and optional providerId from metadata.
 * Returns icon with tooltip, or null if provider not recognized.
 */
export function getProviderIconByModel(
  model: string,
  providerId?: string,
): React.ReactNode {
  if (!model) return null;

  // If providerId is provided in metadata, use it directly
  if (providerId && providerId in PROVIDER_ICONS) {
    return getProviderIconWithTooltip(providerId as ProviderId);
  }

  // Otherwise, try to infer from model name
  const inferredProviderId = getProviderIdFromModel(model);
  if (!inferredProviderId) return null;

  return getProviderIconWithTooltip(inferredProviderId);
}

/**
 * Get provider icon by providerId directly.
 * Returns icon with tooltip, or null if provider not recognized.
 */
export function getProviderIcon(providerId: string): React.ReactNode {
  if (providerId in PROVIDER_ICONS) {
    return getProviderIconWithTooltip(providerId as ProviderId);
  }
  return null;
}

interface ProviderIconProps {
  model?: string;
  providerId?: string;
}

/**
 * Renders provider icon with tooltip based on model/providerId.
 * Falls back to Bot icon if provider not recognized.
 */
export function ProviderIcon({ model, providerId }: ProviderIconProps) {
  const icon = model ? getProviderIconByModel(model, providerId) : null;

  if (icon) {
    return <>{icon}</>;
  }

  return <Bot className="size-4" />;
}
