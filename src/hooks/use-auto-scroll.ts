"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

interface UseAutoScrollOptions {
  /** Number of messages to track for scroll behavior */
  messagesLength: number;
  /** Threshold in pixels to consider "at bottom" */
  bottomThreshold?: number;
}

interface UseAutoScrollResult {
  /** Ref to attach to the element at the end of messages */
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  /** Ref to attach to the scrollable container */
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Whether to show the "scroll to bottom" button */
  showScrollButton: boolean;
  /** Function to scroll to the bottom of the container */
  scrollToBottom: () => void;
}

/**
 * Hook to manage auto-scroll behavior for chat-like interfaces.
 * Handles scrolling to bottom on mount (if messages exist) and on new messages.
 */
export function useAutoScroll({
  messagesLength,
  bottomThreshold = 10,
}: UseAutoScrollOptions): UseAutoScrollResult {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const checkScrollPosition = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || messagesLength === 0) {
      setShowScrollButton(false);
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom <= bottomThreshold;

    setShowScrollButton(!isAtBottom);
  }, [messagesLength, bottomThreshold]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll to bottom when component mounts with existing messages.
  // Uses a small delay to ensure DOM is fully rendered after mount,
  // which is necessary when the sidebar opens with persisted messages.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only on mount
  useLayoutEffect(() => {
    if (messagesLength > 0) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll when message count changes
  useLayoutEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    setTimeout(checkScrollPosition, 200);
  }, [messagesLength, checkScrollPosition]);

  // Listen to scroll events on the container
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScrollPosition);
    return () => container.removeEventListener("scroll", checkScrollPosition);
  }, [checkScrollPosition]);

  return {
    messagesEndRef,
    messagesContainerRef,
    showScrollButton,
    scrollToBottom,
  };
}
