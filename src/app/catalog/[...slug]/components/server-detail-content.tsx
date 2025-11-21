import { Github } from "lucide-react";
import Link from "next/link";
import { CopyUrlButton } from "@/components/copy-url-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ServerDetailContentProps {
  description?: string;
  serverUrl?: string;
  repositoryUrl?: string;
}

export function ServerDetailContent({
  description = "No description available",
  serverUrl,
  repositoryUrl,
}: ServerDetailContentProps) {
  return (
    <div className="space-y-6">
      <div className="text-base leading-7 text-muted-foreground mb-4">
        <div className="whitespace-pre-wrap">{description}</div>
      </div>
      {repositoryUrl && (
        <Button variant="secondary" size="sm" asChild>
          <Link
            href={repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Github className="size-4" />
            View Repository
          </Link>
        </Button>
      )}
      <div className="mb-2">
        <h2 className="text-base font-bold">Getting started</h2>
        <p className="text-base leading-7 text-muted-foreground">
          Copy the endpoint URL below and use it within your application or
          automation flow.
        </p>
      </div>

      {serverUrl && (
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={serverUrl}
            className="font-mono text-sm text-muted-foreground min-w-80 max-w-xl bg-transparent border-input focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <CopyUrlButton url={serverUrl} />
        </div>
      )}
    </div>
  );
}
