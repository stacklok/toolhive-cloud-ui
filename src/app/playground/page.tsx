"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Send, Square } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

function getMessageText(
  message: ReturnType<typeof useChat>["messages"][number],
): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export default function PlaygroundPage() {
  const transport = useMemo(
    () => new TextStreamChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, status, stop } = useChat({
    transport,
  });

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  const messagesLength = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll when message count changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesLength]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">Playground</h1>
        <p className="text-muted-foreground text-sm">
          Test MCP servers with AI
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              Send a message to start chatting
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {getMessageText(message)}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                    <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                    <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button type="button" onClick={() => stop()} variant="destructive">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
