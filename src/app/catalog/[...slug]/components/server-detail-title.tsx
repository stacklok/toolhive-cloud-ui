import { HistoryBack } from "@/components/history-back";
import { Badge } from "@/components/ui/badge";

interface ServerDetailTitleProps {
  publisher?: string;
  serverName: string;
  version: string;
}

export function ServerDetailTitle({
  publisher,
  serverName,
  version,
}: ServerDetailTitleProps) {
  return (
    <div className="flex flex-col gap-5">
      <HistoryBack
        fallbackUrl="/catalog"
        variant="secondary"
        size="sm"
        className="w-fit"
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{serverName}</h1>
          <Badge
            variant="secondary"
            className="text-xs text-muted-foreground mt-2"
          >
            v{version}
          </Badge>
        </div>
        <div className="flex items-center">
          {publisher && (
            <span className="text-xs text-muted-foreground">{publisher}</span>
          )}
        </div>
      </div>
    </div>
  );
}
