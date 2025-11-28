"use client";

import { RuntimeError } from "@/components/error-page";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CatalogErrorPage({ error, reset }: ErrorProps) {
  return <RuntimeError error={error} reset={reset} />;
}
