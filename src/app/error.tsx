"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/error-page";
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
  );
}
