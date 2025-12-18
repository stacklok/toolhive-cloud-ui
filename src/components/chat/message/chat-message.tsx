"use client";

import { AssistantMessage } from "./assistant-message";
import {
  type ChatMessageProps,
  getFileParts,
  getTextContent,
  type MessageMetadata,
} from "./helpers";
import { UserMessage } from "./user-message";

export type { ChatMessageProps } from "./helpers";

export function ChatMessage({ message, status }: ChatMessageProps) {
  const isUser = message.role === "user";
  const textContent = getTextContent(message);
  const fileParts = getFileParts(message);

  const metadata = message.metadata as MessageMetadata | undefined;
  const createdAt = metadata?.createdAt
    ? new Date(metadata.createdAt)
    : new Date();

  if (isUser) {
    return (
      <UserMessage
        textContent={textContent}
        fileParts={fileParts}
        createdAt={createdAt}
      />
    );
  }

  return (
    <AssistantMessage
      message={message}
      textContent={textContent}
      metadata={metadata}
      createdAt={createdAt}
      status={status}
    />
  );
}
