import type { ReactNode } from "react";
import { IllustrationEmptyInbox } from "@/components/illustrations/illustration-empty-inbox";
import { IllustrationNoSearchResults } from "@/components/illustrations/illustration-no-search-results";

interface EmptyStateProps {
  variant: "no-servers" | "no-results";
  title: string;
  description: string;
  actions?: ReactNode;
}

export function EmptyState({
  variant,
  title,
  description,
  actions,
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center text-center gap-4 max-w-md">
        {variant === "no-results" ? (
          <IllustrationNoSearchResults className="size-32" />
        ) : (
          <IllustrationEmptyInbox className="size-32" />
        )}

        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {actions}
      </div>
    </div>
  );
}
