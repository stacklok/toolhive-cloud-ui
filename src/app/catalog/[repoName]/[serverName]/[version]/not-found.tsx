import Link from "next/link";
import { ErrorPageLayout } from "@/components/error-page/error-page";
import { NavigateBackButton } from "@/components/navigate-back-button";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-5 px-8 pt-5 pb-8">
      <NavigateBackButton
        href="/catalog"
        variant="outline"
        size="sm"
        className="w-fit"
      />

      <ErrorPageLayout
        title="Server Not Found"
        actions={
          <Button asChild variant="action">
            <Link href="/catalog">Browse Catalog</Link>
          </Button>
        }
      >
        The MCP server you're looking for doesn't exist or has been removed from
        the catalog.
      </ErrorPageLayout>
    </div>
  );
}
