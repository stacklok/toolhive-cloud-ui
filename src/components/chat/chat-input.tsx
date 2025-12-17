import type { ChatStatus, FileUIPart } from "ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  usePromptInputAttachments,
} from "../ai-elements/prompt-input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const errorToastConfig = {
  max_files: {
    id: "error_max_files",
    title: "You reached the maximum number of files",
    description: "You can only upload up to 5 files",
  },
  max_file_size: {
    id: "error_max_file_size",
    title: "File size too large",
    description: "The file size must be less than 10MB",
  },
  accept: {
    id: "error_accept",
    title: "File type not supported",
    description: "Only images and PDFs are supported",
  },
} as const;

interface ChatInputProps {
  status: ChatStatus;
  onSendMessage: (message: {
    text: string;
    files?: FileUIPart[];
  }) => Promise<void>;
  onStopGeneration: () => void;
  hasProviderAndModel: boolean;
}

function InputWithAttachments({
  text,
  setText,
  status,
  onStopGeneration,
  hasProviderAndModel,
}: Omit<ChatInputProps, "onSendMessage"> & {
  text: string;
  setText: (text: string) => void;
}) {
  const attachments = usePromptInputAttachments();
  const prevTextRef = useRef(text);

  // Clear attachments when text is cleared and message is ready
  useEffect(() => {
    if (
      prevTextRef.current &&
      !text &&
      attachments.files.length > 0 &&
      status === "submitted"
    ) {
      attachments.clear();
    }
    prevTextRef.current = text;
  });

  const getPlaceholder = () => {
    if (!hasProviderAndModel) return "Select an AI model to get started";
    return "Type your message...";
  };

  const handleSubmit = () => {
    const isStoppable = ["streaming", "error", "submitted"].includes(status);
    if (isStoppable) {
      onStopGeneration();
    }
    // if there is an error, clear the attachments
    if (status === "error") {
      attachments.clear();
    }
  };

  return (
    <>
      <PromptInputBody>
        <PromptInputAttachments>
          {(attachment) => (
            <Tooltip>
              <TooltipTrigger asChild>
                <PromptInputAttachment data={attachment} />
              </TooltipTrigger>
              <TooltipContent>{attachment.filename}</TooltipContent>
            </Tooltip>
          )}
        </PromptInputAttachments>
        <PromptInputTextarea
          onChange={(e) => setText(e.target.value)}
          value={text}
          placeholder={getPlaceholder()}
        />
      </PromptInputBody>
      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments label="Add images or PDFs" />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
        </PromptInputTools>
        <PromptInputSubmit
          onClick={handleSubmit}
          disabled={!text}
          status={status}
        />
      </PromptInputToolbar>
    </>
  );
}

export function ChatInputPrompt({
  status,
  onSendMessage,
  onStopGeneration,
  hasProviderAndModel,
}: ChatInputProps) {
  const [text, setText] = useState<string>("");

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    try {
      onSendMessage({
        text: message.text || "Sent with attachments",
        files: message.files,
      });
      // Only clear text after successful send
      setText("");
    } catch (error) {
      console.error("Failed to send message:", error);
      if (message.text) {
        setText(message.text);
      }
      // Don't clear on error so user can retry
    }
  };

  return (
    <PromptInput
      accept="image/*,application/pdf,.pdf"
      onError={(er) => {
        if (!("code" in er)) {
          console.error("PromptInput onError: unknown error", er);
          return;
        }

        const config = errorToastConfig[er.code];
        if (config) {
          toast.error(config.title, {
            id: config.id,
            description: config.description,
            duration: 5000,
          });
        }
      }}
      onAbort={onStopGeneration}
      onSubmit={handleSubmit}
      maxFiles={5}
      globalDrop
      multiple
      syncHiddenInput
    >
      <InputWithAttachments
        status={status}
        onStopGeneration={onStopGeneration}
        hasProviderAndModel={hasProviderAndModel}
        text={text}
        setText={setText}
      />
    </PromptInput>
  );
}
