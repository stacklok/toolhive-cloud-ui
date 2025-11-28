"use client";

import { ErrorPage } from "@/components/error-page";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CatalogErrorPage({ error, reset }: ErrorProps) {
  return <ErrorPage error={error} reset={reset} />;
}
