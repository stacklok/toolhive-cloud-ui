"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorPage } from "./error-page";

interface RuntimeErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function RuntimeError({ error, reset }: RuntimeErrorProps) {
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
