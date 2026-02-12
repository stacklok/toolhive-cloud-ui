import Link from "next/link";
import { ErrorPageLayout } from "@/components/error-page/error-page";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex flex-col flex-1 overflow-hidden px-4 py-5">
        <ErrorPageLayout
          title="Page Not Found"
          actions={
            <Button asChild variant="action" className="rounded-full">
              <Link href="/catalog">Browse Catalog</Link>
            </Button>
          }
        >
          The page you're looking for doesn't exist or has been moved.
        </ErrorPageLayout>
      </main>
    </div>
  );
}
