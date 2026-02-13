"use client";

import type { ChatStatus, UIMessage } from "ai";
import { formatDistanceToNow } from "date-fns";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Streamdown } from "streamdown";
import { ProviderIcon } from "@/components/chat/provider-icons";
import { FilePart } from "./file-part";
import type { MessageMetadata } from "./helpers";
import { ImagePart } from "./image-part";
import { Reasoning } from "./reasoning";
import { StepBoundary } from "./step-boundary";
import { TokenUsage } from "./token-usage";
import { ToolCall } from "./tool-call";

interface MessageFooterProps {
  createdAt: Date;
  model?: string;
}

function MessageFooter({ createdAt, model }: MessageFooterProps) {
  return (
    <div className="text-muted-foreground text-xs">
      {formatDistanceToNow(createdAt, { addSuffix: true })}
      {model && (
        <span className="text-muted-foreground/70 ml-2">&bull; {model}</span>
      )}
    </div>
  );
}

interface StreamingResponseProps {
  textContent: string;
  status: ChatStatus;
}

function StreamingResponse({ textContent, status }: StreamingResponseProps) {
  if (!textContent) return null;
  return (
    <div>
      <Streamdown
        isAnimating={status === "streaming"}
        className="prose prose-sm text-foreground/80 max-w-none [&_h1]:text-foreground/85 [&_h2]:text-foreground/80 [&_h3]:text-foreground/75 [&_table]:border-border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:text-foreground/75 [&_td]:border-border [&_a]:text-primary [&_strong]:text-foreground/90 [&_em]:text-foreground/75 [&_blockquote]:border-muted-foreground/30 [&_a:hover]:underline [&_blockquote]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:text-xs [&_em]:italic [&_h1]:mt-3 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h1:first-child]:mt-0 [&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2:first-child]:mt-0 [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-medium [&_h3:first-child]:mt-0 [&_li]:ml-2 [&_li]:text-sm [&_ol]:mb-2 [&_ol]:list-inside [&_ol]:list-decimal [&_ol]:space-y-0.5 [&_p]:mb-2 [&_p]:leading-relaxed [&_p:last-child]:mb-0 [&_pre]:text-xs [&_strong]:font-medium [&_table]:mb-4 [&_table]:min-w-full [&_table]:rounded-md [&_table]:border [&_td]:border [&_td]:px-3 [&_td]:py-2 [&_td]:text-xs [&_th]:border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_ul]:mb-2 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:space-y-0.5"
        remarkPlugins={[remarkGfm, remarkMath]}
      >
        {textContent}
      </Streamdown>
    </div>
  );
}

interface NoContentMessageProps {
  textContent: string;
  status: ChatStatus;
  message: UIMessage;
}

function NoContentMessage({
  textContent,
  status,
  message,
}: NoContentMessageProps) {
  const hasFiles = message.parts.some((p) => p.type === "file");

  if (
    !textContent &&
    !hasFiles &&
    status !== "streaming" &&
    message.parts.length === 0
  ) {
    return (
      <div className="text-muted-foreground text-sm italic">
        No response content
      </div>
    );
  }

  return null;
}

interface AssistantMessageProps {
  message: UIMessage;
  textContent: string;
  metadata: MessageMetadata | undefined;
  createdAt: Date;
  status: ChatStatus;
}

export function AssistantMessage({
  message,
  textContent,
  metadata,
  createdAt,
  status,
}: AssistantMessageProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-card flex size-8 shrink-0 items-center justify-center rounded-lg">
        <ProviderIcon
          model={metadata?.model}
          providerId={metadata?.providerId}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-2 pr-2">
        <div className="wrap-break-word">
          {message.parts.map((part, index) => {
            const key = `${message.id}-${part.type}-${index}`;

            switch (part.type) {
              case "text":
                return null;

              case "step-start":
                return <StepBoundary key={key} part={part} index={index} />;

              case "reasoning":
                return <Reasoning key={key} part={part} status={status} />;

              case "dynamic-tool":
                return <ToolCall key={key} part={part} />;

              case "file":
                return <FilePart key={key} part={part} />;

              default:
                // Handle image parts (not standard AI SDK type)
                if (
                  (part as Record<string, unknown>).type === "image" &&
                  "data" in part
                ) {
                  return <ImagePart key={key} part={part} />;
                }

                // Handle all tool-* parts
                if (part.type.startsWith("tool-")) {
                  return <ToolCall key={key} part={part} />;
                }

                return null;
            }
          })}

          <StreamingResponse textContent={textContent} status={status} />
          <NoContentMessage
            textContent={textContent}
            status={status}
            message={message}
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <MessageFooter createdAt={createdAt} model={metadata?.model} />
          <TokenUsage
            usage={metadata?.totalUsage}
            responseTime={metadata?.responseTime}
            providerId={metadata?.providerId}
          />
        </div>
      </div>
    </div>
  );
}
