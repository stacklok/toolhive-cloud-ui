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
import { McpServerSelector } from "./mcp-server-selector";
import { ModelSelector } from "./model-selector";

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
  selectedModel: string;
  onModelChange: (model: string) => void;
}

function InputWithAttachments({
  text,
  setText,
  status,
  onStopGeneration,
  hasProviderAndModel,
  selectedModel,
  onModelChange,
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
    if (status === "error") {
      attachments.clear();
    }
  };

  return (
    <>
      <PromptInputBody className="p-1">
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
          className="min-h-[60px]"
          autoFocus
        />
      </PromptInputBody>
      <PromptInputToolbar className="p-2">
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger className="rounded-full bg-secondary text-secondary-foreground" />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments label="Add images or PDFs" />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
          <McpServerSelector />
        </PromptInputTools>
        <PromptInputSubmit
          onClick={handleSubmit}
          disabled={!text}
          status={status}
          variant="action"
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
  selectedModel,
  onModelChange,
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
      setText("");
    } catch (error) {
      console.error("Failed to send message:", error);
      if (message.text) {
        setText(message.text);
      }
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
        selectedModel={selectedModel}
        onModelChange={onModelChange}
      />
    </PromptInput>
  );
}
