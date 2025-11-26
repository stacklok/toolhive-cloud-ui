import Link from "next/link";
import { IllustrationNoLocation } from "@/components/illustrations/illustration-no-location";
import { NavigateBackButton } from "@/components/navigate-back-button";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-5 px-8 pt-5 pb-8">
      <NavigateBackButton
        href="/catalog"
        variant="secondary"
        size="sm"
        className="w-fit"
      />

      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center text-center gap-4 max-w-md">
          <IllustrationNoLocation className="size-40" />

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Server Not Found
            </h2>
            <p className="text-muted-foreground">
              The MCP server you're looking for doesn't exist or has been
              removed from the catalog.
            </p>
          </div>

          <div className="flex gap-2 mt-2">
            <Button asChild variant="default">
              <Link href="/catalog">Browse Catalog</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
