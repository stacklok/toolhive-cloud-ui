import type { FileUIPart, UIMessage } from "ai";

export type MessagePart = UIMessage["parts"][number];

export interface ChatMessageProps {
  message: UIMessage;
  status: import("ai").ChatStatus;
}

export interface MessageMetadata {
  createdAt?: number;
  model?: string;
  providerId?: string;
  totalUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  responseTime?: number;
}

export function getTextContent(message: UIMessage): string {
  return message.parts
    .filter(
      (p): p is Extract<MessagePart, { type: "text" }> => p.type === "text",
    )
    .map((p) => p.text)
    .join("");
}

export function getFileParts(message: UIMessage): FileUIPart[] {
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
