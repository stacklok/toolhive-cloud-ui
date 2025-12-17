"use client";

import type { ChatStatus, FileUIPart, UIMessage } from "ai";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Paperclip,
  User,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MessagePart = UIMessage["parts"][number];

interface ChatMessageProps {
  message: UIMessage;
  status: ChatStatus;
}

function ToolCallComponent({ part }: { part: MessagePart }) {
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isOutputOpen, setIsOutputOpen] = useState(false);

  if (!part.type.startsWith("tool-")) return null;

  const toolName = part.type.replace("tool-", "");
  const hasState = "state" in part;
  const state = hasState ? (part as { state?: string }).state : null;

  return (
    <div className="bg-card mb-3 rounded-lg border p-3">
      <div className="mb-2 flex items-center gap-2">
        <Wrench className="h-4 w-4 text-blue-500" />
        <span className="text-foreground text-sm font-medium">
          Tool: {toolName}
        </span>
        {state === "output-available" && (
          <CheckCircle className="h-4 w-4 text-green-500" />
        )}
        {state === "output-error" && (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
      </div>

      {"input" in part && part.input !== undefined && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setIsInputOpen(!isInputOpen)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs transition-colors"
          >
            {isInputOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span>Input Parameters</span>
          </button>
          {isInputOpen && (
            <div className="mt-2">
              <pre className="bg-background overflow-x-auto rounded border p-2 text-xs">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {"output" in part && part.output !== undefined && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setIsOutputOpen(!isOutputOpen)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs transition-colors"
          >
            {isOutputOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span>Tool Result</span>
            <CheckCircle className="h-3 w-3 text-green-500" />
          </button>
          {isOutputOpen && (
            <div className="mt-2">
              <pre className="bg-background max-h-60 overflow-x-auto rounded border p-2 text-xs">
                {JSON.stringify(part.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter(
      (p): p is Extract<MessagePart, { type: "text" }> => p.type === "text",
    )
    .map((p) => p.text)
    .join("");
}

function getFileParts(message: UIMessage): FileUIPart[] {
  // Check if files are in parts with type "file"
  return message.parts
    .filter(
      (p): p is Extract<MessagePart, { type: "file" }> => p.type === "file",
    )
    .map((p) => {
      if (
        "url" in p &&
        typeof p.url === "string" &&
        "mediaType" in p &&
        typeof p.mediaType === "string"
      ) {
        const filePart: FileUIPart = {
          type: "file",
          url: p.url,
          mediaType: p.mediaType,
        };
        if ("filename" in p && typeof p.filename === "string") {
          filePart.filename = p.filename;
        }
        return filePart;
      }
      return null;
    })
    .filter((f): f is FileUIPart => f !== null);
}

function FileAttachment({
  file,
  isUserMessage,
}: {
  file: FileUIPart;
  isUserMessage?: boolean;
}) {
  const isImage = file.mediaType?.startsWith("image/");
  const displayName = file.filename || "Attachment";

  return (
    <div
      className={`rounded-lg border p-2 ${
        isUserMessage
          ? "bg-primary-foreground/10 border-primary-foreground/20"
          : "bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-2">
        {isImage && file.url ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
            {/* unoptimized is required for blob URLs and data URLs which cannot be optimized by Next.js */}
            <Image
              alt={displayName}
              className="size-full object-cover"
              height={48}
              src={file.url}
              unoptimized
              width={48}
            />
          </div>
        ) : (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded ${
              isUserMessage ? "bg-primary-foreground/10" : "bg-muted"
            }`}
          >
            <Paperclip
              className={`h-4 w-4 ${
                isUserMessage ? "text-primary-foreground" : ""
              }`}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div
            className={`text-sm font-medium truncate ${
              isUserMessage ? "text-primary-foreground" : "text-foreground"
            }`}
          >
            {displayName}
          </div>
        </div>
        {file.url && (
          <a
            href={file.url}
            download={file.filename || "attachment"}
            className={`shrink-0 transition-colors ${
              isUserMessage
                ? "text-primary-foreground/70 hover:text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label={`Download ${displayName}`}
          >
            <Download className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

export function ChatMessage({ message, status }: ChatMessageProps) {
  const isUser = message.role === "user";
  const textContent = getTextContent(message);
  const fileParts = getFileParts(message);
  const metadata = message.metadata as { createdAt?: number } | undefined;
  const createdAt = metadata?.createdAt
    ? new Date(metadata.createdAt)
    : new Date();

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[80%] items-start gap-3">
          <div className="space-y-2">
            <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
              {textContent && (
                <div className="prose prose-sm prose-invert max-w-none wrap-break-word">
                  <Markdown remarkPlugins={[remarkGfm]}>{textContent}</Markdown>
                </div>
              )}
              {fileParts.length > 0 && (
                <div className={`${textContent ? "mt-2" : ""} space-y-2`}>
                  {fileParts.map((file, index) => (
                    <FileAttachment
                      key={file.filename || file.url || index}
                      file={file}
                      isUserMessage={true}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="text-muted-foreground text-right text-xs">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </div>
          </div>
          <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <User className="text-primary-foreground h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
      <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
        <Bot className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 space-y-2 pr-2">
        <div className="wrap-break-word">
          {message.parts.map((part, index) => {
            if (part.type.startsWith("tool-")) {
              return (
                <ToolCallComponent
                  key={`tool-${index}-${part.type}`}
                  part={part}
                />
              );
            }
            return null;
          })}

          {(fileParts.length > 0 || textContent) && (
            <div className="bg-muted/50 rounded-lg border p-3">
              {fileParts.length > 0 && (
                <div className="mb-2 space-y-2">
                  {fileParts.map((file, fileIndex) => (
                    <FileAttachment
                      key={file.filename || file.url || fileIndex}
                      file={file}
                    />
                  ))}
                </div>
              )}
              {textContent && (
                <div className="prose prose-sm text-foreground/80 max-w-none [&_a]:text-primary [&_a:hover]:underline [&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:text-xs [&_pre]:bg-muted [&_pre]:rounded [&_pre]:p-3 [&_pre]:text-xs [&_table]:border [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1">
                  <Markdown remarkPlugins={[remarkGfm]}>{textContent}</Markdown>
                </div>
              )}
            </div>
          )}

          {!textContent &&
            fileParts.length === 0 &&
            status !== "streaming" &&
            message.parts.length === 0 && (
              <div className="text-muted-foreground text-sm italic">
                No response content
              </div>
            )}
        </div>

        <div className="text-muted-foreground text-xs">
          {formatDistanceToNow(createdAt, { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}
