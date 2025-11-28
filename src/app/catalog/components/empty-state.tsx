import { IllustrationEmptyInbox } from "@/components/illustrations/illustration-empty-inbox";
import { IllustrationNoSearchResults } from "@/components/illustrations/illustration-no-search-results";
import { Button } from "@/components/ui/button";

interface NoServersEmptyStateProps {
  variant: "no-servers";
}

interface NoResultsEmptyStateProps {
  variant: "no-results";
  searchQuery: string;
  onClearSearch: () => void;
}

type EmptyStateProps = NoServersEmptyStateProps | NoResultsEmptyStateProps;

export function EmptyState(props: EmptyStateProps) {
  const isNoResults = props.variant === "no-results";

  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center text-center gap-4 max-w-md">
        {isNoResults ? (
          <IllustrationNoSearchResults className="size-32" />
        ) : (
          <IllustrationEmptyInbox className="size-32" />
        )}

        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {isNoResults ? "No results found" : "No servers available"}
          </h2>
          <p className="text-muted-foreground">
            {isNoResults
              ? `We couldn't find any servers matching "${props.searchQuery}". Try adjusting your search.`
              : "There are no MCP servers in the catalog yet. Check back later."}
          </p>
        </div>

        {isNoResults && (
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={props.onClearSearch}>
              Clear search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
