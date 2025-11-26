import Link from "next/link";
import { IllustrationNoLocation } from "@/components/illustrations/illustration-no-location";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex flex-col flex-1 overflow-hidden px-4 py-5">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center text-center gap-4 max-w-md">
            <IllustrationNoLocation className="size-40" />

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Page Not Found
              </h2>
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            <div className="flex gap-2 mt-2">
              <Button asChild variant="default">
                <Link href="/catalog">Browse Catalog</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
