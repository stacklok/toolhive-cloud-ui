interface TokenUsageProps {
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  responseTime?: number;
  providerId?: string;
}

export function TokenUsage({
  usage,
  responseTime,
  providerId,
}: TokenUsageProps) {
  if (!usage || usage.totalTokens === 0) return null;

  return (
    <div className="text-muted-foreground flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1">
        <span className="font-mono">{usage.inputTokens.toLocaleString()}</span>
        <span className="text-muted-foreground/70">→</span>
        <span className="font-mono">{usage.outputTokens.toLocaleString()}</span>
        <span className="text-muted-foreground/70">tokens</span>
      </div>

      {responseTime && responseTime > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground/70">•</span>
          <span className="font-mono">{(responseTime / 1000).toFixed(2)}s</span>
        </div>
      )}

      {providerId && (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground/70">•</span>
          <span className="capitalize">{providerId}</span>
        </div>
      )}
    </div>
  );
}
