import { Github } from "lucide-react";
import Link from "next/link";
import { CopyUrlButton } from "@/components/copy-url-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ServerDescription({ description }: { description?: string }) {
  return (
    <div className="text-base leading-7 text-muted-foreground mb-4">
      <div className="whitespace-pre-wrap">{description}</div>
    </div>
  );
}

function GettingStarted({ serverUrl }: { serverUrl?: string }) {
  return (
    <>
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
            className="font-mono text-sm text-muted-foreground min-w-80 max-w-xl bg-white dark:bg-card border-input focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <CopyUrlButton
            url={serverUrl}
            variant="action"
            className="rounded-md"
          />
        </div>
      )}
    </>
  );
}

function RepositoryLink({ repositoryUrl }: { repositoryUrl?: string }) {
  if (!repositoryUrl) return null;

  return (
    <Button variant="action" size="sm" asChild>
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
  );
}

interface ServerDetailProps {
  description?: string;
  serverUrl?: string;
  repositoryUrl?: string;
}

export function ServerDetail({
  description = "No description available",
  serverUrl,
  repositoryUrl,
}: ServerDetailProps) {
  return (
    <div className="space-y-6">
      <ServerDescription description={description} />
      <RepositoryLink repositoryUrl={repositoryUrl} />
      <GettingStarted serverUrl={serverUrl} />
    </div>
  );
}
