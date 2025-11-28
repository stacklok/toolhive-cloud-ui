"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/error-page";
import { NavbarLogo } from "@/components/navbar-logo";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col h-screen">
      <header className="w-full border-b bg-muted/50 flex items-center justify-between pl-8 pr-4 h-16">
        <NavbarLogo />
      </header>
      <main className="flex flex-col flex-1 overflow-hidden px-4 py-5">
        <ErrorPage
          title="Something went wrong"
          actions={
            <Button onClick={reset} variant="default">
              Try again
            </Button>
          }
        >
          An unexpected error occurred. Please try again.
        </ErrorPage>
      </main>
    </div>
  );
}
