"use client";

import type { FileUIPart } from "ai";
import { formatDistanceToNow } from "date-fns";
import { User } from "lucide-react";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import { AttachmentPreview } from "./attachment-preview";

interface UserMessageProps {
  textContent: string;
  fileParts: FileUIPart[];
  createdAt: Date;
}

export function UserMessage({
  textContent,
  fileParts,
  createdAt,
}: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[80%] items-start gap-3">
        <div className="space-y-2">
          <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
            {textContent && (
              <div className="prose prose-sm max-w-none wrap-break-word">
                <Streamdown isAnimating={false} remarkPlugins={[remarkGfm]}>
                  {textContent}
                </Streamdown>
              </div>
            )}
            {fileParts.length > 0 && (
              <div
                className={`${textContent ? "mt-2" : ""} flex flex-wrap gap-2`}
              >
                {fileParts.map((file, index) => (
                  <AttachmentPreview
                    key={file.filename || file.url || index}
                    attachment={file}
                    totalAttachments={fileParts.length}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="text-muted-foreground text-right text-xs">
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </div>
        </div>
        <div className="bg-card flex size-8 shrink-0 items-center justify-center rounded-lg">
          <User className="text-primary size-4" />
        </div>
      </div>
    </div>
  );
}
