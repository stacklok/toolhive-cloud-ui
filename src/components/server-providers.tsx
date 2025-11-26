import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

interface ServerProvidersProps {
  children: ReactNode;
}

export function ServerProviders({ children }: ServerProvidersProps) {
  return (
    <NuqsAdapter>
      {children}
      <Toaster
        richColors
        duration={2000}
        position="bottom-right"
        offset={{ top: 50 }}
        closeButton
      />
    </NuqsAdapter>
  );
}
